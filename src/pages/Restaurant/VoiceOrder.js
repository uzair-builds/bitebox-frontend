

import React, { useState, useContext, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { getToken } from '../../services/LocalStorageService';
import CartID from '../plugins/CartID';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useGetLoggedUserQuery } from '../../services/userAuthApi';
import { cartContext } from '../plugins/Context';

const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
});

const VoiceOrder = () => {
  // Load initial state from localStorage
  const loadInitialState = () => {
    const savedData = localStorage.getItem('voiceOrderData');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return {
      orderItems: [],
      orderConfirmed: false,
      location: { latitude: null, longitude: null },
      stage: 'initial',
      userAddress: { name: '', phone: '', address: '', city: '' },
      addressFieldIndex: 0,
      fieldConfirmed: false,
      allOrderItems: [],
      noItemsFound: false
    };
  };

  const initialState = loadInitialState();
  
  const [orderItems, setOrderItems] = useState(initialState.orderItems);
  const [allOrderItems, setAllOrderItems] = useState(initialState.allOrderItems);
  const [orderConfirmed, setOrderConfirmed] = useState(initialState.orderConfirmed);
  const [location, setLocation] = useState(initialState.location);
  const [stage, setStage] = useState(initialState.stage);
  const [userAddress, setUserAddress] = useState(initialState.userAddress);
  const [addressFieldIndex, setAddressFieldIndex] = useState(initialState.addressFieldIndex);
  const [fieldConfirmed, setFieldConfirmed] = useState(initialState.fieldConfirmed);
  const [isMicReady, setIsMicReady] = useState(false);
  const [noItemsFound, setNoItemsFound] = useState(initialState.noItemsFound);

  const addressFields = ['name', 'phone', 'address', 'city'];

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const CartId = CartID();
  const [cartCount, setCartCount] = useContext(cartContext);
  const { access_token } = getToken();
  const { data: userData } = useGetLoggedUserQuery(access_token);

  // Warm up audio context on component mount
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContext.suspend();
    } catch (e) {
      console.log("AudioContext not supported:", e);
    }

    return () => {
      SpeechRecognition.stopListening();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    const persistData = {
      orderItems,
      allOrderItems,
      orderConfirmed,
      location,
      stage,
      userAddress,
      addressFieldIndex,
      fieldConfirmed,
      noItemsFound
    };
    localStorage.setItem('voiceOrderData', JSON.stringify(persistData));
  }, [orderItems, allOrderItems, orderConfirmed, location, stage, userAddress, addressFieldIndex, fieldConfirmed, noItemsFound]);

  const speak = (text, callback) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    if (callback) utterance.onend = callback;
    window.speechSynthesis.speak(utterance);
  };

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log("Beep not supported:", e);
    }
  };

  const listenForInput = () => {
    resetTranscript();
    SpeechRecognition.startListening({ 
      continuous: true,
      language: 'en-US'
    }).catch(err => {
      console.error("Speech recognition error:", err);
      speak("Sorry, I couldn't start listening. Please try again.");
    });
  };

  const handleStart = () => {
    resetTranscript();
    setNoItemsFound(false);
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          alert("Please enable location services to use voice ordering.");
        }
      );
    } else {
      alert("Geolocation not supported by your browser.");
    }
  };

  const handleStop = () => {
    SpeechRecognition.stopListening();
    setIsMicReady(false);
  };

  const handleSend = async () => {
    SpeechRecognition.stopListening();
    setIsMicReady(false);
    
    if (!transcript.trim()) {
      setNoItemsFound(true);
      return alert('No speech detected.');
    }
    if (!location.latitude || !location.longitude) {
      return alert("Location not available.");
    }

    try {
      const res = await fetch('https://bitebox-backend-production.up.railway.app/api/restaurant/voice-order/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: transcript,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.order_items && data.order_items.length > 0) {
          setOrderItems(data.order_items);
          setNoItemsFound(false);
        } else {
          setOrderItems([]);
          setNoItemsFound(true);
          speak("Sorry, I couldn't find any items matching your request. Please try again.");
        }
        setOrderConfirmed(false);
      } else {
        setNoItemsFound(true);
        // alert(data.error || data.message || 'Something went wrong');
        Swal.fire({
          icon: 'error',
          title: data.error || data.message || 'Something went wrong'
        })
      }
    } catch (err) {
      setNoItemsFound(true);
      alert('Failed to process voice input');
    }
  };

  // NEW: Function to delete an unconfirmed item
  const handleDeleteItem = (indexToDelete) => {
    setOrderItems(prevItems => prevItems.filter((_, index) => index !== indexToDelete));
  };

  // NEW: Function to reset everything
  const handleResetAll = () => {
    setOrderItems([]);
    setAllOrderItems([]);
    setOrderConfirmed(false);
    setStage('initial');
    setUserAddress({ name: '', phone: '', address: '', city: '' });
    setNoItemsFound(false);
    resetTranscript();
    localStorage.removeItem('voiceOrderData');
    speak("All items and information have been cleared. You can start fresh now.");
  };

  const carthandler = async () => {
    try {
      // Add current items to allOrderItems, avoiding duplicates
      // const updatedAllItems = [...allOrderItems];
      // orderItems.forEach(newItem => {
      //   const existingIndex = updatedAllItems.findIndex(
      //     item => item.id === newItem.id && 
      //            item.portion_size === newItem.portion_size && 
      //            item.spice_level === newItem.spice_level
      //   );
      //   if (existingIndex >= 0) {
      //     updatedAllItems[existingIndex].quantity += newItem.quantity;
      //   } else {
      //     updatedAllItems.push(newItem);
      //   }
      // });
      // setAllOrderItems(updatedAllItems);

      const updatedAllItems = [...allOrderItems]; // Create a copy

orderItems.forEach(newItem => {
  const existingIndex = updatedAllItems.findIndex(
    item => item.id === newItem.id && 
           item.portion_size === newItem.portion_size && 
           item.spice_level === newItem.spice_level
  );

  if (existingIndex >= 0) {
    // REPLACE the old item with the new one (including quantity)
    updatedAllItems[existingIndex] = newItem; 
  } else {
    // ADD new item if no match found
    updatedAllItems.push(newItem);
  }
});

setAllOrderItems(updatedAllItems);

      for (const item of orderItems) {
        const formdata = new FormData();
        formdata.append("dish_id", item.id);
        formdata.append("user_id", userData?.id);
        formdata.append("qty", item.quantity);
        formdata.append("price", item.final_price);
        formdata.append("country", "undefined");
        formdata.append("portionSize", item.portion_size ?? 'No portion size');
        formdata.append("spiceLevel", item.spice_level ?? 'No spice level');
        formdata.append("cart_id", CartId);
        formdata.append('is_voice_item', 'true');

        await axios.post('https://bitebox-backend-production.up.railway.app/api/store/cart-voice-order/', formdata);
      }

      Toast.fire({ icon: "success", title: "All items added to cart" });

      const url = userData
        ? `https://bitebox-backend-production.up.railway.app/api/store/cart-list/${CartId}/${userData.id}/`
        : `https://bitebox-backend-production.up.railway.app/api/store/cart-list/${CartId}/`;

      const res = await axios.get(url);
      setCartCount(res?.data.length);
      
      setOrderItems([]);
      setStage('afterCart');
      setNoItemsFound(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleProceedToDelivery = () => {
    speak("Please say your full name clearly after the beep", () => {
      resetTranscript();
      playBeep();
      setIsMicReady(true);
      
      setTimeout(() => {
        SpeechRecognition.startListening({ 
          continuous: true,
          language: 'en-US'
        }).then(() => {
          console.log("Listening started successfully");
        }).catch(err => {
          console.error("Failed to start listening:", err);
          speak("Sorry, I couldn't start the microphone. Please try again.");
        });
      }, 1000);
    });
    
    setStage('address');
    setAddressFieldIndex(0);
    setFieldConfirmed(false);
  };

  useEffect(() => {
    if (stage === 'address' && !fieldConfirmed && transcript.trim()) {
      const field = addressFields[addressFieldIndex];
      setUserAddress((prev) => ({ ...prev, [field]: transcript.trim() }));
    }
  }, [transcript]);

  const confirmCurrentField = () => {
    SpeechRecognition.stopListening();
    setFieldConfirmed(true);
    setIsMicReady(false);
    
    if (addressFieldIndex + 1 < addressFields.length) {
      const nextIndex = addressFieldIndex + 1;
      setTimeout(() => {
        setAddressFieldIndex(nextIndex);
        setFieldConfirmed(false);
        speak(`Please say your ${addressFields[nextIndex]} after the beep`, () => {
          playBeep();
          setIsMicReady(true);
          setTimeout(() => {
            listenForInput();
          }, 800);
        });
      }, 800);
    } else {
      handleFinalOrder();
    }
  };

  const retryCurrentField = () => {
    SpeechRecognition.stopListening();
    resetTranscript();
    setIsMicReady(false);
    
    setUserAddress(prev => ({
      ...prev,
      [addressFields[addressFieldIndex]]: ''
    }));

    speak(`Please say your ${addressFields[addressFieldIndex]} again after the beep`, () => {
      playBeep();
      setIsMicReady(true);
      setTimeout(() => {
        listenForInput();
      }, 800);
    });
  };

  const handleFinalOrder = async () => {
    try {
      const finalData = new FormData();
      finalData.append("cart_id", CartId);
      finalData.append("user_id", userData?.id);
      finalData.append("full_name", userAddress.name);
      finalData.append("mobile", userAddress.phone);
      finalData.append("address", userAddress.address);
      finalData.append("city", userAddress.city);
      finalData.append("is_voice_order", "true"); // Add this flag
      
      await axios.post("https://bitebox-backend-production.up.railway.app/api/store/create-order/", finalData);

      setOrderConfirmed(true);
      setStage('done');
      speak("Your order has been confirmed. Thank you!");
      
      setTimeout(() => {
        setOrderItems([]);
        setAllOrderItems([]);
        setOrderConfirmed(false);
        setStage('initial');
        setUserAddress({ name: '', phone: '', address: '', city: '' });
        resetTranscript();
        localStorage.removeItem('voiceOrderData');
      }, 4000);
    } catch (error) {
      alert("Order could not be submitted.");
    }
  };

  const handleAddMoreItems = () => {
    resetTranscript();
    setOrderItems([]);
    setNoItemsFound(false);
    setStage('initial');
    handleStart();
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h2>🎤 Voice Order</h2>
      <h5>Place Your Order with Your Voice
      Skip the typing — just speak! Use our voice ordering feature to quickly and easily place your food order hands-free. It's fast, simple, and perfect for when you're on the go.</h5>
      <div className='mt-3'>
        <button onClick={handleStart}>Start Listening</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleSend}>Send Order</button>
        <button onClick={resetTranscript}>Clear</button>
        {/* NEW: Reset All button */}
        <button onClick={handleResetAll} style={{ backgroundColor: '#ff4444', color: 'white' }}>
          🔄 Reset All
        </button>
      </div>

      <p className='mt-1'><strong>Status:</strong> {listening ? '🎙️ Listening...' : '🛑 Stopped'}</p>
      {isMicReady && <p style={{color: 'green'}}>🎤 Microphone is ready - speak now</p>}
      <p><strong>Transcript:</strong> {transcript}</p>

      {/* Show message when no items found */}
      {noItemsFound && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          No items found matching your request. Please try again.
        </div>
      )}

      {/* Show order preview */}
      {(allOrderItems.length > 0 || orderItems.length > 0) && (
        <div>
          <h3>🧾 Order Preview</h3>
          <ul>
            {allOrderItems?.map((item, index) => (
              <li key={`all-${index}`} style={{ opacity: 0.7 }}>
                {item.quantity} x {item.title} @ Rs.{item.final_price} {item.portion_size} {item.spice_level} {item.restaurant}
              </li>
            ))}
            {orderItems.length > 0 && orderItems.map((item, index) => (
              <li key={`current-${index}`} style={{ fontWeight: 'bold' }}>
                {item.quantity} x {item.title} @ Rs.{item.final_price} {item.portion_size} {item.spice_level} {item.restaurant}
                {/* NEW: Delete button for unconfirmed items */}
                <button 
                  onClick={() => handleDeleteItem(index)}
                  style={{ 
                    marginLeft: '10px', 
                    backgroundColor: '#ff4444', 
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: 'none'
                  }}
                >
                  ❌ Delete
                </button>
              </li>
            ))}
          </ul>
          {orderItems.length > 0 && (
            <div>
              <button onClick={carthandler}>✅ Confirm Items to Cart</button>
            </div>
          )}
        </div>
      )}

      {/* ALWAYS show these buttons if we have items in cart */}
      {allOrderItems.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleAddMoreItems}>
            ➕ Add More Items
          </button>
          <button onClick={handleProceedToDelivery}>
            📦 Proceed to Delivery
          </button>
        </div>
      )}

      {/* Also show buttons if we're in afterCart stage (even if allOrderItems is empty) */}
      {stage === 'afterCart' && allOrderItems.length === 0 && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleAddMoreItems}>
            ➕ Add More Items
          </button>
          <button onClick={handleProceedToDelivery}>
            📦 Proceed to Delivery
          </button>
        </div>
      )}

      {stage === 'address' && (
        <div style={{ marginTop: '20px' }}>
          <h4>🎯 Confirming Your Details</h4>
          {addressFields.map((field, index) => (
            <div key={field}>
              <p>
                <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>{' '}
                {userAddress[field] || 'Waiting for input...'}
              </p>
              {index === addressFieldIndex && (
                <>
                  <button onClick={retryCurrentField}>🔁 Say Again</button>
                  <button onClick={confirmCurrentField}>✅ Confirm</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {stage === 'done' && (
        <div style={{ marginTop: '20px' }}>
          <h4>📍 Final Delivery Address</h4>
          <p><strong>Name:</strong> {userAddress.name}</p>
          <p><strong>Phone:</strong> {userAddress.phone}</p>
          <p><strong>Address:</strong> {userAddress.address}</p>
          <p><strong>City:</strong> {userAddress.city}</p>
          <p style={{color: 'green', fontWeight: 'bold'}}>✅ Order confirmed successfully!</p>
        </div>
      )}
    </div>
  );
};

export default VoiceOrder;