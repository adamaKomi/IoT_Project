import os

def check_file_exists(file_path, file_description):
    """Vérifie si un fichier existe."""
    if not os.path.exists(file_path):
        print(f"Erreur : Le fichier {file_description} '{file_path}' est introuvable.")
        return False
    return True
