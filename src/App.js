import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app'; 
import { getDatabase, ref, update, onValue } from 'firebase/database'; 
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; // Import Auth

import './App.css';  // Import your CSS here



// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhuCGgOrIMpw_T6vEg0XTJtn9Thju82mM",
  authDomain: "wheelchair-85175.firebaseapp.com",
  databaseURL: "https://wheelchair-85175-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "wheelchair-85175",
  storageBucket: "wheelchair-85175.appspot.com",
  messagingSenderId: "1078287864607",
  appId: "YOUR_APP_ID" // Replace with your app ID from Firebase project settings
};


// Initialize Firebase app and database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); // Initialize Auth


function App() {
  const [direction, setDirection] = useState('None');
  const [sliderValue, setSliderValue] = useState(0);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cctvStream, setCctvStream] = useState("https://wasp-trusty-sheep.ngrok-free.app/?action=stream"); // CCTV stream URL



  const mapRef = useRef(null);


  useEffect(() => {
    // Function to check if the user is on a mobile device
    const isMobile = () => /Mobi|Android/i.test(navigator.userAgent);

    if (isMobile()) {
      const interval = setInterval(() => {
        setCctvStream(`https://wasp-trusty-sheep.ngrok-free.app/?action=stream&timestamp=${Date.now()}`); // Update stream
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval); // Clean up on unmount
    }
  }, []); // No dependencies


  useEffect(() => {
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedEmail = localStorage.getItem('email');

    if (storedIsLoggedIn) {
      setIsLoggedIn(true);
      setEmail(storedEmail);
    }
  }, []);



  useEffect(() => {
    const latRef = ref(database, 'latitude');
    const lonRef = ref(database, 'longitude');

    // Listen for changes in latitude
    onValue(latRef, (snapshot) => {
      const latValue = snapshot.val();
      if (latValue) {
        setLatitude(latValue);
      }
    });

    // Listen for changes in longitude
    onValue(lonRef, (snapshot) => {
      const lonValue = snapshot.val();
      if (lonValue) {
        setLongitude(lonValue);
      }
    });
  }, [database]);
/// Handle 

// Handle login
const handleLogin = (e) => {
  e.preventDefault();
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('email', email);
      setError(''); // Clear any previous error
    })
    .catch((err) => {
      setError({ message: err.message, style: { color: 'red' } }); // Set error message with red color
    });
};



// Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
  };



  
// Handle direction changes when a button is pressed
const handleDirectionStart = (newDirection) => {
  setDirection(newDirection);

  // Update Firebase with the direction status
  update(ref(database), {
    Up: newDirection === 'Up' ? 'ON' : 'OFF',
    Down: newDirection === 'Down' ? 'ON' : 'OFF',
    Left: newDirection === 'Left' ? 'ON' : 'OFF',
    Right: newDirection === 'Right' ? 'ON' : 'OFF',
    UpLeft: newDirection === 'UpLeft' ? 'ON' : 'OFF',
    UpRight: newDirection === 'UpRight' ? 'ON' : 'OFF',
    DownLeft: newDirection === 'DownLeft' ? 'ON' : 'OFF',
    DownRight: newDirection === 'DownRight' ? 'ON' : 'OFF',
    None: 'OFF'
  }).catch(error => console.error('Firebase update error:', error));

  console.log('Direction:', newDirection);

  // Apply 2-second timeout for UpLeft, UpRight, DownLeft, DownRight
  if (['UpLeft', 'UpRight', 'DownLeft', 'DownRight'].includes(newDirection)) {
    setTimeout(() => {
      // Turn off the specific direction after 2 seconds
      update(ref(database), {
        [newDirection]: 'OFF'
      }).catch(error => console.error('Firebase update error:', error));
      console.log(`${newDirection} OFF after 2 seconds`);
    },500); // 2000 milliseconds = 2 seconds
  }
};

// Reset all directions when the button is released
const handleDirectionEnd = () => {
  // Do nothing here for the 4 special directions (they will turn off automatically after 2 seconds)
  setDirection('None');
  
  update(ref(database), {
    Up: 'OFF',
    Down: 'OFF',
    Left: 'OFF',
    Right: 'OFF',
    None: 'OFF'
    // Note: UpLeft, UpRight, DownLeft, DownRight are handled by timeout and will be turned off automatically
  }).catch(error => console.error('Firebase update error:', error));

  console.log('Direction: OFF');
};



  const handleSliderChange = (event) => {
    const newValue = parseInt(event.target.value);
    setSliderValue(newValue);

    update(ref(database), { sliderValue: newValue })
      .catch(error => console.error('Firebase update error:', error));

    console.log('Slider value:', newValue);
  };



  const mapSrc = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBuzxW-JdJsb4hKk8J1t1KPYzWRuhYTrI8&center=${latitude},${longitude}&zoom=15`;


  
  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <h1>Login</h1>
        {error && <p style={error.style}>{error.message}</p>} {/* Display error message */}

        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleLogin} style={styles.button}>Login</button>
      </div>
    );
  }


  return (
    
    
    
    
    <div style={styles.container}>
      <h1>Car Control</h1>
      <button onClick={handleLogout} style={styles.button}>Logout</button>

      
      {/* Directional buttons */}
      <div style={styles.arrowContainer}>
        <div style={styles.horizontalArrows}>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('UpLeft')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('UpLeft')}
            onTouchEnd={handleDirectionEnd}
          >
            ↖️
          </button>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('Up')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('Up')}
            onTouchEnd={handleDirectionEnd}
          >
            ⬆️
          </button>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('UpRight')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('UpRight')}
            onTouchEnd={handleDirectionEnd}
          >
            ↗️
          </button>
        </div>
        <div style={styles.horizontalArrows}>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('Left')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('Left')}
            onTouchEnd={handleDirectionEnd}
          >
            ⬅️
          </button>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('Right')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('Right')}
            onTouchEnd={handleDirectionEnd}
          >
            ➡️
          </button>
        </div>
        <div style={styles.horizontalArrows}>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('DownLeft')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('DownLeft')}
            onTouchEnd={handleDirectionEnd}
          >
            ↙️
          </button>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('Down')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('Down')}
            onTouchEnd={handleDirectionEnd}
          >
            ⬇️
          </button>
          <button 
            style={styles.arrowButton} 
            onMouseDown={() => handleDirectionStart('DownRight')}
            onMouseUp={handleDirectionEnd}
            onTouchStart={() => handleDirectionStart('DownRight')}
            onTouchEnd={handleDirectionEnd}
          >
            ↘️
          </button>
        </div>
      </div>
      <div style={styles.sliderDesign}>
  Direction: {direction === 'None' ? 'OFF' : direction}
</div>

      <input
        type="range"
        min={0}
        max={255}
        value={sliderValue}
        onChange={handleSliderChange}
        style={styles.slider} 
      />
      <p>Slider Value: {sliderValue}</p>
      <h2 style={styles.label}>CCTV Camera</h2>

      <div style={styles.mediaContainer}>
        <div style={styles.videoContainer}>
          {/* <h2 style={styles.label}>CCTV Camera</h2> */}
          <iframe
           src={cctvStream}
           title="CCTV Camera"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={styles.video}
          ></iframe>
        </div>

        <div style={styles.mapContainer}>
          <h2 style={styles.label}>Car Location</h2>
          {latitude && longitude ? ( 
            <>
              <iframe
                src={mapSrc}
                width="600"
                height="450"
                style={styles.map}
                allowFullScreen=""
                loading="lazy"
                title="Car Location"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>

              <button 
                style={styles.button}
                onClick={() => window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')}
              >
                Open in Google Maps
              </button>
            </>
          ) : (
            <p>Loading map...</p>
          )}
        </div>
      </div>
    </div>
  );
}
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100vh',
    backgroundColor: '#333',
    color: 'white',
    paddingBottom: '100px',
  },

  loginContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh', // Keep this for full viewport height
    width: '100vw', // Set full viewport width
    padding: '20px', // Add padding for more space
    backgroundColor: '#333',
    color: 'white',
  },
  input: {
    fontSize: '18px', // Increase font size
    padding: '10px',  // Add padding for better spacing
    width: '250px',   // Set a width for the input fields
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '10px', // Add space between inputs
  },
  
  

  arrowContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '20px 0',
  },
  horizontalArrows: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '300px',
  },
  arrowButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '20px',
    fontSize: '20px',
    cursor: 'pointer',
    margin: '5px',
    outline: 'none', // Removes focus outline
    boxShadow: 'none', // Removes shadow on focus
    userSelect: 'none', // Prevents text selection on long press
    '-webkit-user-select': 'none', // For mobile WebKit browsers
    '-moz-user-select': 'none', // For Firefox
    '-ms-user-select': 'none', // For Internet Explorer/Edge
    '-webkit-tap-highlight-color': 'transparent', // Removes mobile highlight
    touchAction: 'none', // Disables default touch behaviors
},



sliderDesign: {
  outline: 'none', // Removes focus outline


  boxShadow: 'none', // Removes shadow on focus
  userSelect: 'none', // Prevents text selection on long press
  '-webkit-user-select': 'none', // For mobile WebKit browsers
  '-moz-user-select': 'none', // For Firefox
  '-ms-user-select': 'none', // For Internet Explorer/Edge
  '-webkit-tap-highlight-color': 'transparent', // Removes mobile highlight
  touchAction: 'none', // Disables default touch behaviors
  
},


  slider: {
    width: '300px',
    marginTop: '10px',
  },
  mediaContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center items horizontally
    justifyContent: 'center', // Center items vertically
    width: '100%',
    padding: '20px',
  },
  videoContainer: {
    display: 'flex',
    justifyContent: 'center', // Center the video
    width: '100%',
    marginBottom: '30px', // Add some space between video and map
  },
  video: {
    width: '600px', // Adjusted width for better display
    height: '500px',
    borderRadius: '10px',
  },
  mapContainer: {
    display: 'flex',
    flexDirection: 'column', // Stack map and button vertically
    alignItems: 'center', // Center the map
    justifyContent: 'center',
    width: '100%',
  },
  map: {
    width: '600px', // Adjusted width for better display
    height: '5s00px',
    borderRadius: '10px',
  

  },
  label: {
    marginBottom: '10px',
    textAlign: 'center', // Center the title text
    fontSize: '18px', // Adjust font size for better readability
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px', // Add margin above the button
  },
};


export default App;
