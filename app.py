import string
import sqlite3
import random
from datetime import datetime
from flask import * 
from functools import wraps

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.route('/')
@app.route('/login')
@app.route('/create')
@app.route('/profile')
@app.route('/channel')
@app.route('/channel/<int:channel_id>')
@app.route('/channel/<int:channel_id>/<int:post_id>')
def index(channel_id = None, post_id = None):
    return app.send_static_file('index.html')


def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/belay.db')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None


def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u


@app.route('/api/login', methods=['POST'])
def login():
    
    if request.method == 'POST':
        name = request.json.get('user')
        
        password = request.json.get('pass')

        u = query_db('select * from users where name = ? and password = ?', [name, password], one=True)

        if u:
            print("Success")
            return jsonify({'Success': True, 'id': u['id'], 'name': u['name'], 'api_key': u['api_key']})
        
        else:
            print("couldn't find that user")
            return jsonify({'Success': False})



@app.route('/api/signup', methods=['GET'])
def signup():
    if request.method == 'GET':
        user = new_user()
        return jsonify({'Success': True, 'api_key': user['api_key'], 'id': user['id'], 'name': user['name'], 'pass': user['password']})
    return jsonify({'Success': False})


@app.route('/api/logout')
def logout():
    return None


# Endpoint to update user's username
@app.route('/api/username', methods=['POST'])
def update_username():
    
    user_id = request.json.get('user')
    new_name = request.json.get('name')
    API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

    # Check if API key is provided and valid
    if request.headers.get('api_key') != API_KEY[0]:
        return jsonify({'error': 'Invalid API key'}), 401

    # Update user's username in database
    username = query_db('UPDATE users SET name = ? WHERE id = ?', [new_name, user_id])

    return jsonify({'Success': True, 'message': 'Username updated successfully'})


# POST to change the user's password
@app.route('/api/password', methods=['POST'])
def update_password():
    
    user_id = request.json.get('user')
    new_pass = request.json.get('pass')
    API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

    if len(new_pass) > 0:
        # Check if API key is provided and valid
        if request.headers.get('api_key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

        # Update user's password in database
        password = query_db('UPDATE users SET password = ? WHERE id = ?', [new_pass, user_id])

        return jsonify({'Success': True, 'message': 'Password updated successfully'}), 200
    
    return jsonify({'message': 'Password needs to be greater than 0 length'}), 401



@app.route('/api/create_channel', methods=['POST'])
def create_channel():
    if (request.method == 'POST'):
        user_id = request.json.get('user')
        new_name = request.json.get('name')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        if len(new_name) > 0:
            # Check if API key is provided and valid
            if request.headers.get('api_key') != API_KEY[0]:
                return jsonify({'error': 'Invalid API key'}), 401

            channel = query_db('insert into channels (name) values (?)', [new_name], one=True)            
            return jsonify({'Success': True, 'message': 'Channel name updated successfully'})
        
        else:
             return jsonify({'flag': False})
    else:
        return jsonify({'flag': False})
    

@app.route('/api/delete_channel', methods=['POST'])
def delete_channel():
    if (request.method == 'POST'):
        user_id = request.json.get('user')
        id = request.json.get('id')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        if len(id) > 0:
            # Check if API key is provided and valid
            if request.headers.get('api_key') != API_KEY[0]:
                return jsonify({'error': 'Invalid API key'}), 401

            channel = query_db('DELETE from channels where id = ?', [id], one=True)            
            return jsonify({'Success': True, 'message': 'Channel was deleted successfully'})
        
        else:
            return jsonify({'flag': False})
    
    else:
        return jsonify({'flag': False})


# POST to change the name of a room
@app.route('/api/channel_name', methods=['POST', 'GET'])
def update_channel_name():

    if request.method == 'POST':
        
        user_id = request.json.get('user')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)
        if request.headers.get('api_key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

        new_name = request.json.get('new_name')
        channel_id = request.json.get('channel')
        
        if len(new_name) > 0:
            # Update user's password in database
            channel_name = query_db('UPDATE channels SET name = ? WHERE id = ?', [new_name, channel_id])

            return jsonify({'Success': True, 'message': 'Channel name updated successfully'})
        return jsonify({'message': 'Name needs to be greater than 0 length'}), 401


    if request.method == 'GET':
        user_id = request.headers.get('user')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)
        if request.headers.get('api_key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

        channel_id = request.headers.get('channel_id')
        channel_name = query_db('select name from channels where id = ?', [channel_id], one=True)

        return jsonify({'Success': True, 'name': channel_name[0]})
    
    else:
        return jsonify({'Success': False})



@app.route('/api/channels', methods=['GET'])
def get_channels():
    if request.method == 'GET':
        user_id = request.headers.get('user_id')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        if request.headers.get('api_key') != API_KEY[0]:
                return jsonify({'error': 'Invalid API key'}), 401

        channels = query_db('select * from channels')

        if channels:
            channel_names = []
            ids = []
            for id, names in channels:
                channel_names.append(names)
                ids.append(id)
            
            return jsonify({'Success': True, 'channel_names': channel_names, 'channel_ids': ids})
            
        else:
            return jsonify({'Success': False})
    


# GET / POST to get or post a new message to a room
@app.route('/api/messages', methods=['GET', 'POST'])
def get_post_message():
    
    if request.method == 'POST':

        reply_id = request.json.get('reply_id')
        user_id = request.json.get('user')
        channel_id = request.json.get('channel')
        content = request.json.get('content')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        if len(content) > 0:
            # Check if API key is provided and valid
            if request.headers.get('API_Key') != API_KEY[0]:
                return jsonify({'error': 'Invalid API key'}), 401

            # Insert message into database
            message = query_db('INSERT INTO messages (channel_id, user_id, content, replies_to) VALUES (?, ?, ?, ?)', [channel_id, user_id, content, reply_id], one=True)

            return jsonify({'message': 'Message posted successfully'}), 200
        return jsonify({'message': 'Message needs to be greater than 0 length'}), 401


    if request.method == "GET":
        user_id = request.headers.get('user')
        channel_id = request.headers.get('channel')
        last_ind = request.headers.get('ind')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        # Check if API key is provided and valid
        if request.headers.get('API_Key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401
        

        messages = query_db("""select name, m.content, m.id, COALESCE(reply_counts.total_replies, 0) AS total_replies from messages m
                    LEFT JOIN users on m.user_id = users.id 
                    LEFT JOIN (SELECT replies_to, COUNT(*) AS total_replies FROM messages GROUP BY replies_to) 
                    AS reply_counts ON m.id = reply_counts.replies_to
                    WHERE m.replies_to IS NULL AND m.channel_id = ?;""", [channel_id])

        if messages:
            json_messages = []
            for message in messages:
                json_message = {
                    'name': message[0],
                    'content': message[1],
                    'id': message[2],
                    'total_replies': message[3]
                }
                json_messages.append(json_message)

            return jsonify({'flag': True, 'messages': json_messages})
        
        else:
            return jsonify({'flag': False})


# GET replies to a message
@app.route('/api/reactions', methods=['POST'])
def save_reaction():
    if request.method == "POST":
        user_id = request.json.get('user')
        emoji = request.json.get('emoji')
        message_id = request.json.get('message')

        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        # Check if API key is provided and valid
        if request.headers.get('API_Key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

        # Get messages from database
        reaction = query_db('INSERT INTO reactions (emoji, message_id, user_id) VALUES (?, ?, ?)', [emoji, message_id, user_id], one=True)
        
        return jsonify({'Success': True, 'message': 'Reaction updated successfully'})
    
    return jsonify({'message': 'Name needs to be greater than 0 length'}), 401


# GET replies to a message
@app.route('/api/replies', methods=['GET'])
def get_replies():
    if request.method == "GET":
        user_id = request.headers.get('user')
        channel_id = request.headers.get('channel')
        message_id = request.headers.get('message')

        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        # Check if API key is provided and valid
        if request.headers.get('api_key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

        # Get messages from database
        replies = query_db('select name, content, messages.id from messages LEFT JOIN users on messages.user_id = users.id WHERE replies_to = ?', [message_id])

        if replies:
            json_messages = []
            for message in replies:
                json_message = {
                    'name': message[0],
                    'content': message[1],
                    'id': message[2]
                }
                json_messages.append(json_message)

            return jsonify({'Success': True, 'replies': json_messages})
        
        else:
            return jsonify({'Success': False})
        

# Update last read
@app.route('/api/lastread', methods=['POST'])
def last_message():
    if request.method == 'POST':

        user_id = request.json.get('user')
        channel_id = request.json.get('channel')
        message_id = request.json.get('message')
        API_KEY = query_db('select api_key from users where id = ?', [user_id], one=True)

        # Check if API key is provided and valid
        if request.headers.get('API_Key') != API_KEY[0]:
            return jsonify({'error': 'Invalid API key'}), 401

            # Insert message into database
        message = query_db('INSERT INTO seen_messages (user_id, channel_id, latest_message_id) VALUES (?, ?, ?)', [user_id, channel_id, message_id], one=True)


# Get unread messages
@app.route('/api/unread', methods=['GET'])
def unread_counts():
    if request.method == 'GET':
        return None
    return None
