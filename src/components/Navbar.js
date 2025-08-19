import { NavLink, Link, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../services/LocalStorageService';
import { useDispatch, useSelector } from 'react-redux';
import { unSetUserToken } from '../features/authSlice';
import { setUserInfo } from '../features/userSlice';
import { useGetLoggedUserQuery } from '../services/userAuthApi';
import { useState, useContext,useEffect } from 'react';
import { cartContext } from '../pages/plugins/Context';
import Swal from 'sweetalert2';


const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

const Navbar = () => {
  const navigate = useNavigate();
  const { access_token } = getToken();
  const dispatch = useDispatch();
  const { data, isSuccess } = useGetLoggedUserQuery(access_token);
  const { access_token1 } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const cartCount = useContext(cartContext);

  const handleLogout = () => {
    dispatch(unSetUserToken({ access_token: null }));
    dispatch(setUserInfo({ email: '', name: '' }));
    removeToken();
    Toast.fire({
      icon: 'warning',
      title: 'Logged out successfully',
    });
    navigate('/login');
    window.location.reload();
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  
  const handleSearchSubmit = () => {
    if (!search.trim()) {
      // e.g. show message with your toast system
      Toast.fire({
        icon: 'warning',
        title: 'Please enter a dish name'
      });
      return;
    }
    navigate(`/search?query=${search}`);
  };
  
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
        <Link
  className="navbar-brand d-flex align-items-center"
  to="/"
  style={{
    height: '56px',          // Keep the navbar's height default
    overflow: 'hidden',      // Prevent logo from pushing navbar height
  }}
>
  <img
    src={`${process.env.PUBLIC_URL}/LogoBitebox.png`}
    alt="Main Bite Logo"
    style={{
      height: '100px',        // Large logo image
      width: '70px',          // Maintain aspect ratio
      marginTop: '-5px'     // Shift image upward to center it within visible area
    }}
  />
</Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ color: 'red' }}
          >
            Account
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {data?.id && (
                <>
                {data?.restaurant_id === null && (
                  <>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="navbarDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Account
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                      <li>
                        <Link to="/customer/account/" className="dropdown-item">
                          <i className="fas fa-user"></i> Account
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/customer/orders/">
                          <i className="fas fa-shopping-cart"></i> Orders
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/customer/notifications/">
                          <i className="fas fa-bell fa-shake"></i> Notifications
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/customer/settings/">
                          <i className="fas fa-gear fa-spin"></i> Settings
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <Link className="voice-order btn btn-primary ms-2" to="/voice-order">
                    Voice Order
                  </Link>
                  <Link className="btn btn-primary ms-2" to="/weather-based-dishes">
                    Weather Food Suggestions
                  </Link>
                  </>
                )}
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="navbarDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Restaurant
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                      {data?.restaurant_id != null ? (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/dashboard/">
                              <i className="fas fa-user"></i> Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/dishes">
                              <i className="bi bi-grid-fill"></i> Dishes
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/add-dish">
                              <i className="fas fa-plus-circle"></i> Add Dishes
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/orders">
                              <i className="fas fa-shopping-cart"></i> Orders
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/earnings">
                              <i className="fas fa-dollar-sign"></i> Earning
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/reviews">
                              <i className="fas fa-star"></i> Reviews
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/notifications/">
                              <i className="fas fa-bell fa-shake"></i> Notifications
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/settings">
                              <i className="fas fa-gear fa-spin"></i> Settings
                            </Link>
                          </li>
                        </>
                      ) : (
                        <li>
                          <Link className="dropdown-item" to="/restaurant-register">
                            Register
                          </Link>
                        </li>
                      )}
                    </ul>
                  </li>
                </>
              )}
            </ul>

            {data?.id && data?.restaurant_id === null && (
              <div className="d-flex align-items-center">
                <input
                  onChange={handleSearchChange}
                  name="search"
                  className="form-control me-2 "
                  type="text"
                  placeholder="Search"
                  aria-label="Search"
                  style={{ 
                    width: '180px',
                    maxWidth: '100%', // Ensures it doesn't overflow on mobile
                    minWidth: '120px' // Minimum width
                  }}
                />
                <button
                  onClick={handleSearchSubmit}
                  className="btn btn-outline-success me-2"
                  type="button"
                >
                  Search
                </button>

                <Link className="btn btn-danger me-2" to="/cart/">
                  <i className="fas fa-shopping-cart"></i>{' '}
                  <span id="cart-total-items">{cartCount}</span>
                </Link>
              </div>
            )}

            {access_token ? (
              <button onClick={handleLogout} className="btn btn-danger me-2">
                Logout
              </button>
            ) : (
              <>
                <Link className="btn btn-primary me-2" to="/login">
                  Login
                </Link>
                <Link className="btn btn-primary me-2" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
