"""
Utilitário para gerar hash bcrypt de senhas e montar o SQL de INSERT.
Uso:
    python gerar_senha.py
    python gerar_senha.py <senha> <username>

Exemplo:
    python gerar_senha.py minhasenha joao
"""
import sys
import bcrypt

if len(sys.argv) >= 3:
    senha = sys.argv[1]
    username = sys.argv[2]
elif len(sys.argv) == 2:
    senha = sys.argv[1]
    username = input("Username: ").strip()
else:
    senha = input("Senha: ").strip()
    username = input("Username: ").strip()

if len(senha.encode('utf-8')) > 72:
    print("AVISO: Senha muito longa (>72 bytes). Será truncada para 72 bytes.")
    senha = senha.encode('utf-8')[:72].decode('utf-8', errors='ignore')

salt = bcrypt.gensalt()
hash_bytes = bcrypt.hashpw(senha.encode('utf-8'), salt)
hash_ = hash_bytes.decode('utf-8')

print(f"\nHash gerado:")
print(hash_)
print(f"\nSQL para inserir/atualizar no banco:")
print(f"INSERT INTO usuarios (username, senha_hash) VALUES ('{username}', '{hash_}');")
print(f"-- ou para atualizar senha existente:")
print(f"UPDATE usuarios SET senha_hash = '{hash_}' WHERE username = '{username}';")
