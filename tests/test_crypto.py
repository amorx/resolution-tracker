import os
from unittest.mock import patch

import pytest
from cryptography.fernet import Fernet

from src.services.crypto import CryptoService


def test_encrypt_and_decrypt_roundtrip() -> None:
    key = Fernet.generate_key().decode("utf-8")
    service = CryptoService(key=key)
    token = service.encrypt("secret")
    assert token != "secret"
    assert service.decrypt(token) == "secret"


def test_decrypt_invalid_token_raises() -> None:
    key = Fernet.generate_key().decode("utf-8")
    service = CryptoService(key=key)
    with pytest.raises(ValueError, match="Unable to decrypt"):
        service.decrypt("not-a-token")


@patch.dict(os.environ, {"ENCRYPTION_KEY": "short"})
def test_crypto_rejects_short_key() -> None:
    with pytest.raises(ValueError, match="valid Fernet key"):
        CryptoService()


@patch.dict(os.environ, {}, clear=True)
def test_crypto_rejects_missing_key() -> None:
    with pytest.raises(ValueError, match="Missing ENCRYPTION_KEY"):
        CryptoService()


def test_crypto_rejects_invalid_format() -> None:
    # Long enough to pass the length gate but not a valid Fernet key.
    with pytest.raises(ValueError, match="valid Fernet key"):
        CryptoService(key="x" * 48)
