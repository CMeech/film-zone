
import os
from flask import Blueprint, render_template, request, flash, send_file, abort
from werkzeug.utils import secure_filename

from features.resources import resource_repository
from features.users.role import Role
from libs.auth.pre_authorize import pre_authorize
from libs.auth.require_auth import require_auth
from libs.auth.team_required import team_required
from libs.context.user_context import get_active_team_id
from libs.logging.logging import logger
from libs.security.rate_limit import limiter

resource_bp = Blueprint('resource', __name__)
limiter.limit("100/minute")(resource_bp)

# Get the application root directory (assumes this file is in a feature subdirectory)
APP_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'resources')
ALLOWED_EXTENSIONS = {'pdf', 'pptx'}

# Add this function to get the correct MIME type
def get_mime_type(filename):
    extension = filename.rsplit('.', 1)[1].lower()
    mime_types = {
        'pdf': 'application/pdf',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
    return mime_types.get(extension, 'application/octet-stream')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@resource_bp.route('/list', methods=['GET'])
@require_auth
@team_required
def list_resources():
    return render_template("resources/list-resources.html")


@resource_bp.route('/list/partial', methods=['GET'])
@require_auth
@team_required
def list_resources_partial():
    try:
        team_id = get_active_team_id()
        resources = resource_repository.get_resources_by_team_id(team_id)
        return render_template("resources/list-resources-partial.html", resources=resources)
    except Exception as e:
        logger.error(f"Failed to list resources: {e}")
        return {"error": "Failed to retrieve resources"}, 500

@resource_bp.route('/create', methods=['GET', 'POST'])
@require_auth
@pre_authorize([Role.ADMIN, Role.COACH])
@team_required
def create_resource():
    if request.method == 'POST':
        # Add debug logging
        logger.info(f"Request Content-Length: {request.content_length}")
        logger.info(f"Request Headers: {dict(request.headers)}")

        if 'file' not in request.files:
            return {"error": "No file part"}, 400

        file = request.files['file']
        if file.filename == '':
            return {"error": "No selected file"}, 400

        if file and allowed_file(file.filename):
            try:
                filename = secure_filename(file.filename)
                team_id = get_active_team_id()

                # Create team folder if it doesn't exist
                team_folder = os.path.join(UPLOAD_FOLDER, str(team_id))
                os.makedirs(team_folder, exist_ok=True)

                logger.debug(f"Uploading file to {team_folder}")
                # Save file
                file_path = os.path.join(team_folder, filename)
                file.save(file_path)

                # Create database entry
                resource_repository.create_resource(
                    filename=filename,
                    file_path=file_path,
                    team_id=team_id
                )

                return {"message": "Resource uploaded successfully"}, 200
            except Exception as e:
                logger.error(f"Failed to create resource: {e}")
                return {"error": "Failed to upload resource"}, 500
        else:
            return {"error": "Invalid file type. Only PDF and PPTX files are allowed."}, 400

    # Only return template for GET requests
    return render_template("resources/create-resource.html")

@resource_bp.route('/view/<int:resource_id>', methods=['GET'])
@require_auth
@team_required
def view_resource(resource_id):
    try:
        resource = resource_repository.get_resource_by_id(resource_id)
        if not resource:
            abort(404)

        # Check if user has access to this team's resources
        team_id = get_active_team_id()
        if resource.team_id != team_id:
            abort(403)

        mime_type = get_mime_type(resource.filename)
        return send_file(
            resource.file_path,
            mimetype=mime_type,
            as_attachment=mime_type != 'application/pdf'  # Download PPTX files instead of viewing them
        )
    except Exception as e:
        logger.error(f"Failed to retrieve resource: {e}")
        abort(500)

@resource_bp.route('/delete/<int:resource_id>', methods=['DELETE'])
@require_auth
@pre_authorize([Role.ADMIN, Role.COACH])
@team_required
def delete_resource(resource_id):
    try:
        resource = resource_repository.get_resource_by_id(resource_id)
        if not resource:
            return {"error": "Resource not found"}, 404

        # Check if user has access to this team's resources
        team_id = get_active_team_id()
        if resource.team_id != team_id:
            return {"error": "Unauthorized"}, 403

        # Delete file from filesystem
        if os.path.exists(resource.file_path):
            os.remove(resource.file_path)

        # Delete database entry
        resource_repository.delete_resource(resource_id)

        return {"message": "Resource deleted successfully"}, 200
    except Exception as e:
        logger.error(f"Failed to delete resource: {e}")
        return {"error": "Failed to delete resource"}, 500