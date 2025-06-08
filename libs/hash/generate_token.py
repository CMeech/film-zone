
import hashlib

def generate_token(data):
    return hashlib.sha256(data.encode()).hexdigest()