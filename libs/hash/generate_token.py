
import hashlib

def generate_token(password):
    return hashlib.sha256(password.encode()).hexdigest()