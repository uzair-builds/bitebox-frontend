import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from '../../services/LocalStorageService';
import { Link } from 'react-router-dom';

const WeatherFoodSuggestions = () => {
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { access_token } = getToken();

  const fetchWeatherAndDishes = async () => {
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=65bbdab36b97a168ba364612f706a449`
        );

        const temperature = weatherRes.data.main.temp;
        const condition = weatherRes.data.weather[0].main.toLowerCase();

        const backendRes = await axios.post(
          "https://bitebox-backend-production.up.railway.app/api/restaurant/weather-dishes/",
          {
            temperature,
            condition,
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        setCategories(backendRes.data.recommended_categories);
        setDishes(backendRes.data.dishes);
        setLoading(false);
      });
    } catch (err) {
      console.error("Error fetching weather-based dishes", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherAndDishes();
  }, []);

  const groupedDishes = categories.reduce((acc, category) => {
    const categoryDishes = dishes.filter(
      (dish) =>
        dish.category?.title?.toLowerCase().trim() === category.toLowerCase().trim()
    );
    if (categoryDishes.length > 0) {
      acc[category] = categoryDishes;
    }
    return acc;
  }, {});

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5">🌤️ Weather-Based Food Suggestions</h2>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3">Loading suggestions...</p>
        </div>
      ) : (
        <>
          {categories.length === 0 ? (
            <p className="text-center">No suggestions available for the current weather.</p>
          ) : (
            Object.keys(groupedDishes).map((category) => (
              <div key={category} className="mb-5">
                <h3 className="mb-4 text-primary border-bottom pb-2">{category}</h3>
                <div className="row">
                  {groupedDishes[category].map((dish) => (
                    <div key={dish.id} className="col-md-4 mb-4">
                      <div className="card h-100 shadow-sm">
                        <img
                          src={`https://bitebox-backend-production.up.railway.app${dish.image}`}
                          className="card-img-top"
                          alt={dish.title}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                        <div className="card-body d-flex flex-column">
                          <Link to={`/dishdetail/${dish.slug}`} className="card-title">{dish.title}</Link>
                          <p className="card-text flex-grow-1">{dish.description}</p>
                          <h6 className="text-success mt-2">Rs {dish.price}</h6>
                        </div>
                        <div className="card-footer bg-white border-0">
                          <span className="badge bg-warning text-dark">
                            {dish.category?.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default WeatherFoodSuggestions;

