#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os   # Imports the operating system module to handle file paths and environment variables
import sys  # Imports the system module to access command-line arguments (like 'runserver')

def main():
    """Run administrative tasks."""
    
    # Tells the computer where to find your project's settings (like database info and API keys)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    
    try:
        # Tries to load the main Django command-line tool
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # If Django isn't installed or your virtual environment isn't active, this error triggers
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Takes the command you typed (e.g., 'python manage.py runserver') and executes it
    execute_from_command_line(sys.argv)

# This ensures the script only runs if you execute it directly, not if it's imported elsewhere
if __name__ == '__main__':
    main()