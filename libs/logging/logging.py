import logging
from config.config import getConfig

# Configure logging
logging.basicConfig(
    level=getConfig().LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s"
)

logger = logging.getLogger(__name__)