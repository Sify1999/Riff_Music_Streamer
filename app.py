from flask import Flask, render_template, send_file , abort , Response , request , jsonify , redirect , url_for
import os
from mutagen.mp3 import MP3
from mutagen.id3 import ID3 , APIC 
from math import ceil
import re
import sqlite3

class DataBase:
    def __init__(self , db_name = "database.db"):
        self.db_name = db_name

    def connect(self):
        return sqlite3.connect(self.db_name)
    
    def init_db(self):
        print("DOINT INIT DB")
        conn = self.connect()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT ,   
            filename TEXT UNIQUE ,
            title TEXT UNIQUE ,
            artist TEXT ,
            duration TEXT 
            )
        """)
        print("created songs table")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS playlists(
            id INTEGER PRIMARY KEY AUTOINCREMENT ,
            name TEXT UNIQUE ,
            description TEXT   
            )
        """)
        print("created playlists table")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS playlist_songs (
            playlist_id INTEGER ,
            song_id INTEGER ,
            PRIMARY KEY (playlist_id , song_id),
            FOREIGN KEY (playlist_id) REFERENCES playlists(id) ,
            FOREIGN KEY (song_id) REFERENCES songs(id)           
                       )
        """)
        print("created playlist_songs table")
        
        conn.commit()
        conn.close()


    def add_song(self , song_name , title , artist , duration):
        conn = self.connect()
        try:
            conn.execute("INSERT INTO songs (filename ,title ,artist ,duration) VALUES (?,?,?,?)" , (song_name , title, artist , duration))
            conn.commit()
            print("New Song added to DB...")
        except sqlite3.IntegrityError:
            pass
        finally:
            conn.close()


    def add_playlist(self, playlist_name, playlist_description):
        conn = self.connect()
        try:
            conn.execute("INSERT INTO playlists (name , description) VALUES (? , ?)", (playlist_name, playlist_description))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()



    def delete_playlist(self , playlist_id):
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM playlist_songs WHERE playlist_id = ?",(playlist_id,))

            cursor.execute("DELETE FROM playlists WHERE id = ?",(playlist_id,))

            conn.commit()
        finally:
            conn.close()


    def edit_playlist(self , playlist_id , new_name , new_description):
        conn = self.connect()
        cursor = conn.cursor()
        try:
            update = []
            value = []

            if new_name:
                update.append("name = ?")
                value.append(new_name)

            if new_description:
                update.append("description = ?")
                value.append(new_description)

            if not update:
                return False

            value.append(playlist_id)


            query = f"""
                UPDATE PLAYLISTS
                SET {', '.join(update)}
                WHERE id = ?
                """

            cursor.execute(query , value)
            conn.commit()

        except sqlite3.IntegrityError:
            return False
        
        finally:
            conn.close()

    def reset_tables(self):
        conn = self.connect()
        cursor = conn.cursor()

        # delete all data (safe order because of relations)
        cursor.execute("DELETE FROM playlist_songs")
        cursor.execute("DELETE FROM songs")
        cursor.execute("DELETE FROM playlists")

        # reset auto-increment counters
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='songs'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='playlists'")

        conn.commit()
        conn.close()

    def fetch_songs(self):
        conn = self.connect()
        cursor = conn.cursor()

        cursor.execute("""
        SELECT filename, title, artist, duration
        FROM songs
        """)    

        songs = [
            {
                "filename": row[0],
                "title": row[1],
                "artist": row[2],
                "duration": row[3],
                "cover": url_for(
                    "static",
                    filename=f"cover/{os.path.splitext(row[0])[0]}.jpg"
                )
            }
            for row in cursor.fetchall()
        ]

        conn.close()
        return songs


    def fetch_playlists(self):
        conn = self.connect()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                playlists.id,
                playlists.name,
                playlists.description,
                COUNT(playlist_songs.song_id) AS song_count
            FROM playlists
            LEFT JOIN playlist_songs
                ON playlists.id = playlist_songs.playlist_id
            GROUP BY playlists.id
        """)

        rows = cursor.fetchall()

        playlists = [
            {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "song_count": row[3],
                "cover" : url_for(
                    "static",
                    filename=f"playlist-cover/{row[1]}.jpg"
                )
            }
            for row in rows
]
        conn.close()

        return playlists


    def fetch_playlist_songs(self , playlist_id):
        conn = self.connect()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT filename, title, artist, duration
            FROM songs
            JOIN playlist_songs 
            ON songs.id = playlist_songs.song_id
            WHERE playlist_songs.playlist_id = ?
        """, (playlist_id,))


        songs = [
            {
                "filename": row[0],
                "title": row[1],
                "artist": row[2],
                "duration": row[3],
                "cover": url_for(
                    "static",
                    filename=f"cover/{os.path.splitext(row[0])[0]}.jpg"
                )
            }
            for row in cursor.fetchall()
        ]

        conn.close()

        return songs

    def fetch_playlist_details(self , playlist_id):
        conn = self.connect()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name, description 
            FROM playlists
            WHERE id = ?
        """, (playlist_id,))

        playlist = cursor.fetchone()

        if playlist is None:
            abort(404)

        return {
            "name": playlist[0],
            "description": playlist[1], 
            "cover": url_for(
                    "static",
                    filename=f"playlist-cover/{playlist[0]}.jpg"
                )
        }


app = Flask(__name__)
database = DataBase()


MUSIC_FOLDER = "static/music"
COVER_FOLDER = "static/cover"
def secure_filename_windows(filename):
    # Remove invalid characters for Windows filenames
    return re.sub(r'[<>:"/\\|?*]', '_', filename)




@app.route("/")
def index():
    print("LOADING INDEX")
    # List all mp3 files in music folder
    songs = database.fetch_songs()
    playlists = database.fetch_playlists()


    print("INDEX DONE")
    return render_template("index.html", songs=songs, playlists=playlists)


@app.route("/stream/<path:filename>")
def stream_music(filename):
    if not filename :
        abort(404) 

    filepath = os.path.join(MUSIC_FOLDER , filename)

    return send_file(filepath , mimetype="audio/mpeg" , as_attachment=False)


@app.route("/upload" , methods=["POST"])
def upload_songs():

    if 'song' not in request.files:
        return redirect(url_for("index"))

    file = request.files['song']

    if file.filename == '':
        return redirect(url_for("index"))

    if not file.filename.endswith(".mp3"):
        return redirect(url_for("index"))
    
    safe_name = secure_filename_windows(file.filename)
    save_path = os.path.join(MUSIC_FOLDER , safe_name)
    file.save(save_path)
    print("New Song Added to folder...")
    audio = MP3(save_path , ID3=ID3)

    title = os.path.splitext(safe_name)[0]   # Fallback to filename
    if audio.tags:
        title_tag = audio.tags.get("TIT2")
        if title_tag:
            title = title_tag.text[0]



    duration = int(audio.info.length)
    minute = duration // 60
    seconds = duration % 60
    duration_text = f"{minute}:{seconds:02}"

    artist = "Unknown Artist"

    if audio.tags:
        artist_tag = audio.tags.get("TPE1")
        if artist_tag:
            artist = artist_tag.text[0]
        for tag in audio.tags.values():
            if isinstance(tag , APIC):
                name = os.path.splitext(safe_name)[0]
                cover_path = os.path.join(COVER_FOLDER , name + ".jpg")

                with open(cover_path, "wb") as f:
                    f.write(tag.data)
                
                break

    database.add_song(safe_name , title , artist , duration_text)

    return redirect(url_for("index"))

@app.route("/get_playlists")
def get_playlists():
    return jsonify(database.fetch_playlists())

@app.route("/add_to_playlist" , methods=["POST"])
def add_to_playlist():
    data = request.json
    song_name = data.get("song")
    playlist_id = data.get("playlist_id")
    print(data)
    print(song_name)
    print(type(song_name))
    conn = database.connect()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM songs WHERE filename = ?" , (song_name,))
    result = cursor.fetchone()

    if not result :
        return jsonify({"error" : "song not found"}) , 404

    song_id = result[0]

    try:
        cursor.execute("INSERT INTO playlist_songs (playlist_id , song_id) VALUES (? , ?)" , (playlist_id , song_id))
        conn.commit()
        print("song added to selected playlist...")
    except sqlite3.IntegrityError:
        print("couldnt add to selected playlist...")

    return jsonify({"success" : True})


PLAYLIST_COVER_FOLDER = "static/playlist-cover"

@app.route("/create_playlist", methods=["POST"])
def create_playlist():
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip()
    cover = request.files.get("cover")

    if not name:
        return jsonify({"error": "name is required"}), 400

    os.makedirs(PLAYLIST_COVER_FOLDER, exist_ok=True)

    success = database.add_playlist(name, description)
    if not success:
        return jsonify({"error": "A playlist with that name already exists"}), 409

    if cover and cover.filename:
        cover_path = os.path.join(PLAYLIST_COVER_FOLDER, f"{name}.jpg")
        cover.save(cover_path)

    return jsonify({"success": True})


@app.route("/playlist/<int:playlist_id>")
def playlist_page(playlist_id):

    songs = database.fetch_playlist_songs(playlist_id)
    playlist = database.fetch_playlist_details(playlist_id)

    return render_template(
        "playlist.html",
        songs = songs ,
        playlist = playlist ,
        playlist_id = playlist_id
    )


if __name__ == "__main__":
    database.init_db()
    # database.reset_tables()
    # database.add_playlist("Main" , """A soundtrack for midnight drives, neon lights, and 
    # the moments that hit differently after dark. From haunting melodies to 
    # smooth R&B, this playlist captures the unmistakable atmosphere of The Weeknd.""")

    # database.add_playlist("Sify" , """A collection of The Weeknd's biggest hits and hidden gems, 
    # blending moody production, soulful vocals, and unforgettable stories
    #  about love, fame, and the night. Perfect for relaxing, driving, or getting lost in the music.""")
    app.run(host = "0.0.0.0" , port=5000 ,debug=False)
