import sqlite3
import os

DB_NAME = "database.db"


def connect():
    return sqlite3.connect(DB_NAME)


def delete_database():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
        print("\nDatabase deleted successfully.")
    else:
        print("\nDatabase file does not exist.")


def show_table(table_name):
    conn = connect()
    cursor = conn.cursor()

    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()

        print(f"\n--- {table_name.upper()} ---")
        for row in rows:
            print(row)

    except sqlite3.OperationalError as e:
        print(f"Error: {e}")

    finally:
        conn.close()


def list_tables():
    if not os.path.exists(DB_NAME):
        print("\nDatabase does not exist.")
        return []

    conn = connect()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()

    print("\nAvailable tables:")
    for t in tables:
        print("-", t[0])

    conn.close()
    return [t[0] for t in tables]


def show_all():
    tables = list_tables()
    for table in tables:
        show_table(table)


if __name__ == "__main__":
    print("SQLite DB Viewer\n")

    while True:
        print("\nOptions:")
        print("1 - Show specific table")
        print("2 - Show all tables")
        print("3 - Delete database")
        print("4 - Exit")

        choice = input("Choose: ")

        if choice == "1":
            table = input("Enter table name: ")
            show_table(table)

        elif choice == "2":
            show_all()

        elif choice == "3":
            confirm = input(
                "Are you sure you want to DELETE the entire database? (y/n): "
            )

            if confirm.lower() == "y":
                delete_database()

        elif choice == "4":
            break

        else:
            print("Invalid choice")