import logging
from config.config import getConfig

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(getConfig().LOG_LEVEL)

handler = logging.StreamHandler()
handler.setLevel(getConfig().LOG_LEVEL)

formatter = logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
handler.setFormatter(formatter)

logger.addHandler(handler)