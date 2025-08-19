

import { useEffect, useState } from "react";
import { useDispatch } from 'react-redux';
import { getToken } from "../services/LocalStorageService";
import { setUserToken } from "../features/authSlice";
import { useUpdateUserLocationMutation, useGetLoggedUserQuery } from "../services/userAuthApi";
import { setUserInfo } from '../features/userSlice';
import axios from 'axios';
import { Link } from "react-router-dom";

const Home = () => {
  const dispatch = useDispatch();
    const [restaurants, setRestaurants] = useState([]);  // State for storing nearby restaurants
    let { access_token } = getToken();
    const {data,isSuccess} = useGetLoggedUserQuery(access_token)
    const [updateUserLocation] = useUpdateUserLocationMutation();  // Mutation hook
    const [categories, setCategories] = useState([]);
    useEffect(() => {
      axios.get('https://bitebox-backend-production.up.railway.app/api/store/categories/')
        .then(response => {
          setCategories(response.data);
          console.log(response.data);
            // Update categories state
        })
        .catch(error => {
          console.error("Error fetching categories:", error);
        });
    }, []); 
    useEffect(() => {
      dispatch(setUserToken({ access_token: access_token }));
      if (data && isSuccess) {
        dispatch(setUserInfo({email:data.email,name:data.name}))
      }
      // Get the user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
  
          // Send the location to the backend
          await updateUserLocation({ latitude, longitude, access_token });
  
          // Fetch nearby restaurants from the API
          axios.get('https://bitebox-backend-production.up.railway.app/api/restaurant/nearby-restaurants/', {
            headers: {
              'Authorization': `Bearer ${access_token}`
            },
            params: {
              latitude: latitude,
              longitude: longitude
            }
          })
          .then(response => {
            setRestaurants(response.data);
            console.log(response.data)  // Set the nearby restaurants
          })
          .catch(error => {
            console.error("Error fetching nearby restaurants:", error);
          });
        });
      } else {
        console.log("Geolocation is not supported by this browser.");
      }
      
    }, [dispatch, access_token, updateUserLocation, data, isSuccess]);
    

  return (
    <>
 
    <div className="container mt-5">
      {/* Hero Section */}
      <section className="text-center mb-5">
        <div className="row align-items-center">
          <div className="col-md-6 text-start">
            <h1 className="display-4 fw-bold">Welcome to BITEBOX 🍔</h1>
            <p className="lead">
              A smarter way to order your favorite meals from local restaurants nearby.
              BITEBOX helps you discover, order, and enjoy your food — fresh and fast.
            </p>
            
            {!data?.id && (
  <Link to="/register" className="btn btn-primary btn-lg mb-4">
    Get Started
  </Link>
)}
          </div>
          <div className="col-md-6">
            <img src={`${process.env.PUBLIC_URL}/mainbite_img.png`} className="img-fluid rounded-4 shadow" alt="Delicious Food" />
          </div>
        </div>
      </section>

      {/* Nearby Restaurants */}
      <section>
        <h2 className="mb-4 text-center fw-bold">Nearby Restaurants 🍽️</h2>
        <div className="row">
          {restaurants.map((r, index) => (
            <div key={index} className="col-lg-4 col-md-6 mb-4">
              <div className="card h-100 shadow-sm border-0">
                <Link to={`/detail/${r.id}`}>
                  <img src={`https://bitebox-backend-production.up.railway.app${r.image}`} className="card-img-top" alt={r.name} style={{ height: '220px', objectFit: 'cover' }} />
                </Link>
                <div className="card-body">
                  <h5 className="card-title">{r.name}</h5>
                  <p className="card-text text-muted">{r.description?.slice(0, 80) || "Tasty meals waiting for you!"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="mt-5">
        <h2 className="mb-4 text-center fw-bold">Categories 🧾</h2>
        <div className="row justify-content-center">
          {categories.map((c, index) => (
            <div key={index} className="col-4 col-md-2 mb-3 text-center">
              <img
                src={c.image}
                alt={c.title}
                className="img-fluid rounded-circle mb-2"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
              <h6 className="fw-semibold">{c.title}</h6>
            </div>
          ))}
        </div>
      </section>
    </div>
    </>
  );
};

export default Home;

