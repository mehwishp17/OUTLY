"""Password hashing configuration.

Argon2id is OWASP's first-choice password hash: memory-hard, so attackers cannot
cheaply parallelise it on GPUs/ASICs the way they can PBKDF2. The parameters are
at or above OWASP's published equivalent-strength options (m=46 MiB, t=1, p=1 /
m=19 MiB, t=2, p=1) and are tunable without a code change:

    ARGON2_MEMORY_KIB (default 47104 = 46 MiB)
    ARGON2_TIME_COST  (default 2)
    ARGON2_PARALLELISM (default 1)

Django upgrades any older hash (PBKDF2) to this one the next time its owner logs
in, because PBKDF2 stays in PASSWORD_HASHERS for verification.
"""
import os

from django.contrib.auth.hashers import Argon2PasswordHasher


class OutlyArgon2PasswordHasher(Argon2PasswordHasher):
    memory_cost = int(os.environ.get("ARGON2_MEMORY_KIB", "47104"))
    time_cost = int(os.environ.get("ARGON2_TIME_COST", "2"))
    parallelism = int(os.environ.get("ARGON2_PARALLELISM", "1"))
