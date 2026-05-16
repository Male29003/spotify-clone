import random, string

def generate_short_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))
