// https://www.w3schools.com/react/react_router.asp
// import { useState, useEffect } from "react";
// import ReactDOM from 'react-dom';

window.localStorage.setItem('ashkanrohani_belay_auth_key', 'arohani');


function Reply(props) {
    
    //SOURCE: https://stackoverflow.com/questions/4098415/use-regex-to-get-image-url-in-html-js
    //SOURCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
    const regexp = /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg)\??.*$/gmi
    const str = props.content;
    let img_arr = [...str.matchAll(regexp)];

    return (
        <div className="reply"> 
            <p><b>{props.username}</b></p>
            {/* <p>{props.content}</p> */}
            {img_arr.length >= 1 ? 
            img_arr.map((url, index) => {
                return <img className="post_pics" key={index} src={url[0]}></img>
            }) : <p>{props.content}</p>}
            <button className='emoji' onClick={() => {props.track_reaction('thumb')}}>👍</button>
            <button className='emoji' onClick={() => {props.track_reaction('burger')}}>🍔</button>
        </div>

    );
}


function Replies(props) {
    return (
        <div className="reply_page" id="reply_page">
                <div className="reply_container">
                    <div className="replies">
                        <h2 className="reply_title">
                            Reply to: {localStorage.getItem("selected_message_content")}
                            <button className="close_channel" onClick={() => {props.close_reply()}}>x</button>
                        </h2>
                        {props.replies.map((reply,index) => {
                            return <Reply 
                                    key={index}
                                    username={reply.name}
                                    content={reply.content}
                                    id={reply.id}
                                    track_reaction={props.track_reaction}
                                    />
                        })}
                    </div>
                </div>
                    
                <div className="newpost" id="newpost_reply">
                    <textarea className="textarea" id="content2" name="textarea"></textarea>
                    <button onClick={() => {props.post_reply()}} htmlFor="submit" value="Post">Post</button>
                </div>
            </div>
        );
}


function SideBar(props) {
    return (
        <div className="sidebar" id="sidebar">
            <p>Channels<button className="add_channel" onClick={() => {props.change_url("/create")}}>+</button></p>
            {props.channel_names.length >= 1 ? 
            props.channel_names.map((name, index) => {
                let ind = props.channel_ids[index]
                return (
                    <button id={'Room' + ind} className="channels" onClick={() => {props.select_channel(name, ind)}}>
                        <span><b> {name} </b></span>
                        <p className="unread"><i> -- 0 unread messages </i></p>
                    </button>
                )
            }): null}
        </div>
    );
}

function MainChat(props) {

    if (localStorage.getItem("id") && localStorage.getItem("current_reply_id")) {
        React.useEffect(() => {
            const intervalId = setInterval(props.get_replies, 500); // Run every 0.5 second (1000 milliseconds)
        
            return () => {
                clearInterval(intervalId);
            };
            }, []);
    }


    function update_room() {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let channel_id = localStorage.getItem("current_channel_id");

        let inp = document.getElementById("new_name");
        let new_name = inp.value;

        let path = window.location.pathname;

        console.log("The new room name is: " + new_name);
      
        try {
          fetch("/api/channel_name", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API_Key": api_key
              },
              body: JSON.stringify({ "new_name": new_name, "channel": channel_id, "user": user_id})
          })
          .then((request) => {
                request.json()
                .then((data) => {
                    if (data.Success) {
                        localStorage.setItem('current_channel_name', new_name)
                        props.change_url(path)
                        inp.value = ''
                    }
                    else {
                        alert("That room name was not found - please try again.")
                    }
                });
            })
        } catch (error) {
          console.error("Error:", error);
        }
    }


    if (localStorage.getItem('current_channel_id')) {
        return (
            <div className="main_chat" id="main_chat">
                <div className="inner_chat">
                    <div className='current_channel'>
                        <div className="chat_form">
                            <h2 className='channel_title'>
                                {localStorage.getItem('current_channel_name')}
                                <input htmlFor="text" className="room_change" id="new_name"></input>
                                <button className="updateButton" onClick={() => {update_room()}}>Update</button>
                                <button className="close_channel" onClick={() => {props.clear_current_page()}}>x</button>
                                </h2>
                            {props.messages.length >= 1 ? 
                            props.messages.map((msg, index) => {
                            return <Message
                                    key={index}
                                    username={msg.name}
                                    content={msg.content}
                                    id={msg.id}
                                    total_replies={msg.total_replies}
                                    select_message={props.select_message}
                                    track_reaction={props.track_reaction}
                                    />
                                }) : null}
                        </div>  
                    </div>  
                </div>    
                <div className="newpost" id="newpost_chat">
                    <textarea className="textarea" id="content" name="textarea"></textarea>
                    <button onClick={() => {props.post_message()}} htmlFor="submit" value="Post">Post</button>
                </div>
            </div>
        )
    }
    else {
        return (
            <div className="main_chat" id="main_chat">
                <div className="inner_chat">
                    <div className='current_channel'>
                        <div className="chat_form">
                            <h2 className='channel_title'>No channel selected</h2>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


function Message(props) { 

    //SOURCE: https://stackoverflow.com/questions/4098415/use-regex-to-get-image-url-in-html-js
    //SOURCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
    const regexp = /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg)\??.*$/gmi
    const str = props.content;
    let img_arr = [...str.matchAll(regexp)];

    function reply_count(total) {
        
        if (total == '0') {
            return 
        }
        else if (total == '1') {
            return " -- 1 reply"
        }
        else {
            return " -- " + total + " replies"
        }
    }

    return (
        <div className="single_post">
            <div className="post"> 

                <p><b>{props.username}</b></p>
                {/* <p>{props.content}</p> */}

                {img_arr.length >= 1 ? 
                img_arr.map((url, index) => {
                    return <img className="pics" key={index} src={url[0]}></img>
                }) : <p>{props.content}</p>}
            </div>
            <button className="reply_button" onClick={() => {props.select_message(props.content, props.id)}}>
                Reply {reply_count(props.total_replies)}
                <button className='emoji' onClick={() => {props.track_reaction('thumb')}}>👍</button>
                <button className='emoji' onClick={() => {props.track_reaction('burger')}}>🍔</button>
            </button>
            
        </div>  
    );
}


function Home(props) {


    // if (window.innerWidth <= 800 | screen.width <= 800) {
    //     document.getElementById('main_chat').style.display = "none";
    //     document.getElementById('reply_page').style.display = "block";
    // }


    function signup() {  
        try {
          fetch("/api/signup", {
              method: "GET",
              headers: {
                  "Content-Type": "application/json"
              }
          })
          .then((request) => {
                request.json()
                .then((data) => {
                    console.log("Success");
                    console.log(data);

                    props.login_state(data.name, data.id)

                    localStorage.setItem("username", data.name);
                    localStorage.setItem("id", data.id);
                    localStorage.setItem("api_key", data.api_key);
                });
            })  
        } catch (error) {
          console.error("Error:", error);
        }
    }

    function post_message() {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let current_channel = localStorage.getItem("current_channel_id")
       
        let inp = document.getElementById("content");
        let content = inp.value;

        try {
          fetch("/api/messages", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API_Key": api_key
              },
              body: JSON.stringify({ "content": content, "channel": current_channel, "user": user_id, "reply_id": null})
          })
          .then((request) => {
                request.json()
                .then((data) => {
                    inp.value = ''
                });
            })
        } catch (error) {
          console.error("Error:", error);
        }
    }

    function post_reply() {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let current_channel = localStorage.getItem("current_channel_id")
        let reply_id = localStorage.getItem("current_reply_id"); 
       
        let inp = document.getElementById("content2");
        let content = inp.value;

        console.log(user_id);
        console.log(current_channel);
        console.log(reply_id);
        console.log(content);
      
        try {
          fetch("/api/messages", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API_Key": api_key
              },
              body: JSON.stringify({ "content": content, "channel": current_channel, "user": user_id, "reply_id": reply_id})
          })
          .then((request) => {
                request.json()
                .then((data) => {
                    inp.value = ''
                });
            })
        } catch (error) {
          console.error("Error:", error);
        }
    }

    function track_reaction(emoji) {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let message_id = localStorage.getItem("current_reply_id");

        try {
          fetch("/api/reactions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API_Key": api_key
              },
              body: JSON.stringify({ "emoji": emoji, "message": message_id, "user": user_id})
          })
          .then((request) => {
                request.json()
            })
        } catch (error) {
          console.error("Error:", error);
        }
    }


    if (localStorage.getItem("id") && localStorage.getItem("current_channel_id")) {
        React.useEffect(() => {
            const intervalId2 = setInterval(props.get_messages, 500); // Run every 1 second (1000 milliseconds)
        
        return () => {
            clearInterval(intervalId2);
        };
            }, []);
    }


    if (localStorage.getItem('id')) {
        return (
        <div>
            <div className="header">
            <h1 className="logo">Welcome to Belay</h1>
            <div className="loginHeader">
                <div className="loggedIn">
                    <a>
                        <span id="profile_banner" className="username">Current User: {localStorage.getItem("username")}</span>
                    </a>
                </div>
                <button onClick={() => {props.change_url("/")}}>Home</button>
                <button onClick={() => {props.change_url("/profile")}}>Profile</button>
                <button onClick={() => {props.change_url("/create")}}>Channel Options</button>
                <button onClick={() => {props.logout()}}>Logout</button>
            </div>
            </div>
        <div className="profile">
            <div className="chat_container">
                <div className="chat">
                    <SideBar
                    change_url={props.change_url}
                    select_channel={props.select_channel}
                    channel_names={props.channel_names}
                    channel_ids={props.channel_ids}
                    post_message={post_message}/>
                        <MainChat
                        messages={props.messages}
                        channel_names={props.channel_names}
                        channel_ids={props.channel_ids}
                        clear_current_page={props.clear_current_page}
                        select_message={props.select_message}
                        get_replies={props.get_replies}
                        track_reaction={track_reaction}
                        post_message={post_message}
                        change_url={props.change_url}/>
                        {localStorage.getItem("open_reply") ? 
                            <Replies
                            post_message={post_message}
                            close_reply={props.close_reply}
                            replies={props.replies}
                            get_replies={props.get_replies}
                            post_reply={post_reply}
                            track_reaction={track_reaction}/>
                            : 
                            null }
                    </div>
                </div> 
            </div>
        </div>
        )
    }

    else {
        return (
        <div>
            <div className="header"> 
            <h1 className="logo">Welcome to Belay</h1>
                <div className="loginHeader">
                </div>
            </div>
            <div className="profile">
                <div className="container">
                    <div>
                    <div>
                            <h2>Please Login or Signup for an Account</h2>
                            <button onClick={() => {props.change_url("/login")}}>Login</button>
                            <button onClick={() => {signup()}}>Signup</button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
        )
    }

}


function CreateRoom(props) {
    
    function create_room() {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
      
        let inp = document.getElementById("new_room_name");
        let new_name = inp.value;
          
        console.log("The new room name is: " + new_name);
      
        try {
            if (new_name) {
                fetch("/api/create_channel", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "API_Key": api_key
                    },
                    body: JSON.stringify({ "name": new_name, "user": user_id})
                })
                .then((request) => {
                        request.json()
                        .then((data) => {
                            console.log("Success:", data);
                            inp.value = '';
                        });
                    })
            } else {
                alert("Please enter a valid room name")
            }
        } catch (error) {
          console.error("Error:", error);
        }
    }
    
    function delete_room() {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
      
        let inp = document.getElementById("delete_id");
        let delete_id = inp.value;
      
        try {
          fetch("/api/delete_channel", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API_Key": api_key
              },
              body: JSON.stringify({ "id": delete_id, "user": user_id})
          })
          .then((request) => {
                request.json()
                .then((data) => {
                    if (data.Success) {
                        inp.value = ''
                    }
                    else {
                        alert("That room id was not found - please try again.")
                    }
                });
            })
        } catch (error) {
          console.error("Error:", error);
        }
    }

    return (
        <div>
            <div className="header">
            <h1>Channel</h1>
            
            <div className="loginHeader"> 
                <div className="loggedIn">
                        <a>
                            <span id="profile_banner" className="username">Current User: {localStorage.getItem("username")}</span>
                        </a>
                    </div>
                    <button onClick={() => {props.change_url("/")}}>Home</button>
                    <button onClick={() => {props.change_url("/profile")}}>Profile</button>
                    <button onClick={() => {props.change_url("/create")}}>Channel Options</button>
                    <button onClick={() => {props.logout()}}>Logout</button>
                </div>
            </div>
    
            <div className="clip">
            <div className="auth container">
                <h2><i>Please create or update an existing room</i></h2>
                <hr></hr>
                <h2>Create Room</h2>
                <div>
    
                    <p><label>Room Name: </label>
                    <input
                    htmlFor="text"
                    id="new_room_name"></input></p>

                    <button onClick={() => {create_room()}}>Create</button>
                </div>

                <hr></hr>
    
                <div>
                    <h2>Delete Room by ID</h2>
                    <p><label>Room ID: </label>
                    <input
                    htmlFor="text"
                    id="delete_id"></input></p>
        
                    <button onClick={() => {delete_room()}}>Delete</button>
                </div>
    
            </div>
            </div>
    
        </div>
        )
}


function Login_Signup(props) {

    function login() {
        let username = document.getElementById("login_user");
        let pass = document.getElementById("login_password");
        
        console.log("The username is: " + username.value);
        console.log("The password is: " + pass.value);
    
        try {
          fetch("/api/login", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ "user": username.value, "pass": pass.value})
          })
          .then((request) => {
            console.log(request)
                request.json()
                .then((data) => {
                    if (data.Success) {

                        props.login_state(data.name, data.id)

                        localStorage.setItem("username", data.name);
                        localStorage.setItem("id", data.id);
                        localStorage.setItem("api_key", data.api_key);

                        console.log("Success", data);
                    }
                    else {
                        username.value = "";
                        pass.value = "";
                        alert('Failed to Login - Try Again')
                    }
                });
          })
        }
          catch (error) {
          console.error("Error:", error);
        }
    }

    function signup() {  
        try {
          fetch("/api/signup", {
              method: "GET",
              headers: {
                  "Content-Type": "application/json"
              }
          })
          .then((request) => {
                request.json()
                .then((data) => {
                    if (data.Success) {
                        console.log("Success");
                        console.log(data);
                        
                        props.login_state(data.name, data.id)
                        
                        localStorage.setItem("username", data.name);
                        localStorage.setItem("id", data.id);
                        localStorage.setItem("api_key", data.api_key);
                    }
                })});

            } 
        catch (error) {
          console.error("Error:", error);
        }
    }

    return (
    <div>
        <div className="header">
        <h1 className="logo">Welcome to Belay</h1>
        
        <div className="loginHeader"> 
            <button onClick={() => {props.change_url("/")}}>Home</button>
        </div>
        </div>

        <div className="clip">
        <div className="auth container">
            <h2><i>Please Login or Signup for an Account</i></h2>
            <hr></hr>
            <h2>Login</h2>
            <div className="alignedForm">

            <p><label>Username: </label>
            <input
            type="text"
            placeholder="Username" 
            id="login_user"></input></p>

            <p><label>Password: </label>
            <input
            type="password"
            placeholder="Password"
            id="login_password"></input></p>

            <button onClick={() => {login()}}>Login</button>
            </div>

            <hr></hr>

            <div>
            <h2>Create an account now!</h2>
            <button onClick={() => {signup()}}>Sign Up</button>
            </div>

        </div>
        </div>

    </div>
    )
}


function Profile(props) {
    function change_user() {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        
        let inp = document.getElementById("changeuser");
        let new_name = inp.value;
    
        console.log("The new username is: " + new_name);
        console.log("The API key is: " + api_key);
      
        if (new_name) {
            try {
            fetch("/api/username", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "API_Key": api_key
                },
                body: JSON.stringify({ "name": new_name, "user": user_id})
            })
            .then((request) => {
                    request.json()
                    .then((data) => {
                        console.log("Success:", data);
                    });

                localStorage.setItem('username', new_name);
                inp.value = "";
                alert("Username changed successfully")
                props.change_url("/profile");
                })
            } catch (error) {
            console.error("Error:", error);
            }
        }
        else {
            inp.value = ""
            alert("Please enter a valid username")
        }
    }   
      
      
    function change_pass() {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        
        let inp = document.getElementById("changepass");
        let new_pass = inp.value;
            
        console.log("The new password is: " + new_pass);
        console.log("The API key is: " + api_key);
      
        if (new_pass) {
            try {
            fetch("/api/password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "API_Key": api_key
                },
                body: JSON.stringify({ "pass": new_pass, "user": user_id})
            })
            .then((request) => {
                    request.json()
                    .then((data) => {
                        console.log("Success:", data);
                        inp.value = "";
                    });
                    alert("Password changed successfully")
                    props.change_url("/profile");
                })
            } catch (error) {
            console.error("Error:", error);
            }
        }
        else {
            inp.value = ""
            alert("Please enter a valid password")
        }
    }
    
    
    return (
    <div>
        <div className="header">
            <h1 className="logo">Belay Profile</h1>
            <div className="loginHeader">
                <div className="loggedIn">
                    <a>
                        <span className="username">Current User: {localStorage.getItem("username")}</span>
                    </a>
                </div>
                <button onClick={() => {props.change_url("/")}}>Home</button>
                <button onClick={() => {props.change_url("/profile")}}>Profile</button>
                <button onClick={() => {props.change_url("/create")}}>Channel Options</button>
                <button onClick={() => {props.logout()}}>Logout</button>
            </div>
        </div>
        
        <div className="auth container">
            <h2>Update Username or Password Below</h2>
            <div className="alignedForm">
                <label htmlFor="username">Username: </label>
                <input id="changeuser" 
                name="username"></input>
                <button onClick={() => {change_user()}}>Update</button>

                <label htmlFor="password">Password: </label>
                <input id="changepass"
                type="password"
                name="password"></input>
                <button onClick={() => {change_pass()}}>Update</button>
            </div>
        </div> 
    </div>
    )
}

class App extends React.Component {
        constructor(props) {
        super(props);
        this.state = {
            isloggedin: false,
            user_id: '',
            username: '',
            channel_names: [],
            channel_ids: [],
            current_channel_id: '',
            current_channel_name: '',
            messages: [],
            replies: [],
            version: 0
        }
        }


    //Check for Back Button Event
    componentDidMount() {
        this.handlePopstate = (event) => {
            console.log('Popstate event occurred!', event);
            let path = window.location.pathname;
            this.change_url(path)
        };
    
        window.addEventListener('popstate', this.handlePopstate);
    }
    
    // Remove the event listener when the component unmounts
    componentWillUnmount() {
        window.removeEventListener('popstate', this.handlePopstate);
    }


    //Check for Channels
    componentDidMount() {
        this.intervalId3 = setInterval(this.get_channels, 1000); // Run every 1 second (1000 milliseconds)
        this.intervalId4 = setInterval(this.check_for_unread, 1000);
    }
    
    componentWillUnmount() {
         clearInterval(this.intervalId3);
         clearInterval(this.intervalId4);
    }
    

    get_channels = () => {
        if (localStorage.getItem('id')) {
            try {
                fetch("/api/channels", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        'api_key': localStorage.getItem("api_key"),
                        'user_id': localStorage.getItem("id")
                    }
            })
            .then((request) => {
                    request.json()
                    .then((data) => {
                        this.setState({channel_names: data.channel_names,
                                        channel_ids: data.channel_ids});
                        localStorage.setItem("channel_names", JSON.stringify(data.channel_names))
                        localStorage.setItem("channel_ids", JSON.stringify(data.channel_ids))
                    });
                })
            }catch (error) {
                console.error("Error:", error);
            }
        }
        }

    get_messages = () => {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let current_channel = localStorage.getItem("current_channel_id")

        try {
            fetch("/api/messages", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "api_key": api_key,
                    "user": user_id,
                    "channel": current_channel
                }
            })
            .then((request) => {
                    request.json()
                    .then((data) => {
    
                        if (data.messages) {
                            this.setState({ messages: data.messages })
                        }
                        else {
                            this.setState({ messages: [] })
                        }
                        
                        localStorage.setItem("messages", this.messages);
                    });
                })  

            
        
        } catch (error) {
        console.error("Error:", error);
        }
    }

    get_replies = () => {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let current_channel = localStorage.getItem("current_channel_id")
        let current_message = localStorage.getItem("current_reply_id")

        try {
            fetch("/api/replies", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "api_key": api_key,
                    "user": user_id,
                    "channel": current_channel,
                    "message": current_message
                }
            })
            .then((request) => {
                    request.json()
                    .then((data) => {
                        if (data.Success) {
                            this.setState({ replies: data.replies })
                        }
                        else {
                            this.setState({ replies: [] })
                        }
                        
                        localStorage.setItem("replies", this.replies);
                    });
                })  

            
        
        } catch (error) {
        console.error("Error:", error);
        }
    }


    check_for_unread = () => {
        //console.log("Checking for unread...")
    }


    login_state = (username, id) => {
        
        this.get_channels();

        this.setState({isLoggedin: true,
                    username: username,
                    user_id: id});

        if (localStorage.getItem("cache_path")){
            this.change_url(localStorage.getItem("cache_path"))
        }
    }


    logout = () => {
        history.pushState('','','/');
        localStorage.clear();
        window.location.reload;
        this.setState({ user_id: '',
                        username: '',
                        isloggedin: false,
                        channel_names: [],
                        channel_ids: [],
                        unread: [],
                        current_channel_id: '',
                        current_channel_name: '',
                        messages: []
                    });
    }

    clear_current_page = () => {

        document.getElementById("Room"+localStorage.getItem("current_channel_id")).className = "channels"

        this.setState({current_channel_id: '',
        current_channel_name: '',
        messages: []})

        this.close_reply();

        localStorage.removeItem("current_channel_id")
        localStorage.removeItem("current_channel_name")


        this.change_url('/')
    }

    close_reply = () => {

        const parts = window.location.pathname.split("/"); // Split the URL by "/"
        parts.pop(); // Remove the last part
        const url = parts.join("/");

        this.setState({current_reply_id: '',
        replies: []})

        localStorage.removeItem("open_reply")
        localStorage.removeItem("current_reply_id")

        this.change_url(url)
    }

    change_url = (path) => {
        history.pushState('', '', path);
        this.setState({path: path});
    }

    select_channel = (name, id) => {

        if (localStorage.getItem("current_channel_id")) {
            document.getElementById("Room"+localStorage.getItem("current_channel_id")).className = "channels"
        }
        
        document.getElementById("Room"+id).className = "active-channel"

        localStorage.setItem("current_channel_name", name)
        localStorage.setItem("current_channel_id", id)
        this.close_reply();

        this.change_url("/channel/" + id)

        this.setState({ current_channel_id: id, 
            current_channel_name: name })
    }

    select_message = (content, id) => {
        let channel = localStorage.getItem("current_channel_id");

        console.log("Inside Channel: " + channel);
        console.log("Selected Message ID: " + id);
        console.log("Selected Message: " + content);

        localStorage.setItem("current_reply_id", id);
        localStorage.setItem("open_reply", true)
        localStorage.setItem("selected_message_content", content)

        this.change_url("/channel/" + channel + '/' + id)

        this.setState({ current_reply_id: id })
    }


    get_channel_name = () => {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let channel_id = window.location.pathname.split("/").pop();

        try {
            fetch("/api/channel_name", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "api_key": api_key,
                    "user": user_id,
                    "channel_id": channel_id
                }
            })
            .then((request) => {
                    request.json()
                    .then((data) => {
                        if (data.Success) {
                            this.select_channel(data.name, channel_id)
                    }});
                })  
        } catch (error) {
        console.error("Error:", error);
        }
    }

    update_last_read = (message_id) => {
        let user_id = localStorage.getItem("id");
        let api_key = localStorage.getItem("api_key");
        let channel_id = window.location.pathname.split("/").pop();
        let latest_message = localStorage.getItem("latest_message")

        try {
            fetch("/api/lastread", {
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                        "api_key": api_key,},
                body: JSON.stringify({ 
                        channel: channel_id,
                        user: user_id,
                        message: latest_message
                        })
                })
                .then((response) => {
                if(response.status != 200) {
                    console.log('error in updating last read')
                }
            });       
        } catch (error) {
            console.error("Error:", error);
            }
    }
    
    render() {

        const channelRegex = /^\/channel$/;
        const roomRegex = /^\/channel\/\d+$/;
        const messageRegex = /^\/channel\/\d+\/\d+$/;

        if (window.location.pathname == "/" | (localStorage.getItem('id') && window.location.pathname == "/login")) {
            
            history.pushState("", "", "/")
            
            return <Home
            change_url={this.change_url}
            logout={this.logout}
            channel_names={this.state.channel_names}
            channel_ids={this.state.channel_ids}
            current_channel_id={this.current_channel_id}
            username={this.state.username}
            user_id={this.state.user_id}
            isloggedin={this.state.isloggedin}
            get_channels={this.get_channels}
            messages={this.state.messages}
            get_messages={this.get_messages}
            select_channel={this.select_channel}
            close_reply={this.close_reply}
            clear_current_page={this.clear_current_page}
            select_message={this.select_message}
            get_replies={this.get_replies}
            replies={this.state.replies}
            login_state={this.login_state}
            />
        }
        
        else if (!localStorage.getItem('id')) {
            
            if (window.location.pathname != "/login") {
                localStorage.setItem("cache_path", window.location.pathname)
            }
            
            return <Login_Signup
            change_url={this.change_url}
            logout={this.logout}
            login_state={this.login_state}
            get_channels={this.get_channels}
            />
        }
        else if (localStorage.getItem('id') && window.location.pathname == '/profile') {
            return <Profile
            username={this.state.username}
            user_id={this.state.user_id}
            change_url={this.change_url}
            logout={this.logout}
            />
        }
        else if (localStorage.getItem('id') && window.location.pathname == '/create') {
            return <CreateRoom
            change_url={this.change_url}
            logout={this.logout}
            />
        }
        else if (localStorage.getItem('id') && window.location.href.indexOf("/channel") != -1) {            

            if (roomRegex.test(window.location.pathname)) {
                 //console.log("Matched Channel");
                 //this.get_channel_name();
             }
             else if (messageRegex.test(window.location.pathname)) {
                 //console.log("Match - message");
             }
             else {
                 //console.log("No match");
             }

            return <Home
            change_url={this.change_url}
            logout={this.logout}
            channel_names={this.state.channel_names}
            channel_ids={this.state.channel_ids}
            current_channel_id={this.current_channel_id}
            username={this.state.username}
            user_id={this.state.user_id}
            isloggedin={this.state.isloggedin}
            get_channels={this.get_channels}
            messages={this.state.messages}
            get_messages={this.get_messages}
            select_channel={this.select_channel}
            close_reply={this.close_reply}
            clear_current_page={this.clear_current_page}
            select_message={this.select_message}
            get_replies={this.get_replies}
            replies={this.state.replies}
            />
        }
    }
}


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <>
    <App />
  </>
);
