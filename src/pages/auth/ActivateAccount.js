import React, { useEffect, useState } from 'react';
import { useParams,Link } from 'react-router-dom';
import axios from 'axios';
import { Alert, CircularProgress, Box, Typography } from '@mui/material';

const ActivateAccount = () => {
  const { uid, token } = useParams();
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const activateUser = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/user/activate/${uid}/${token}/`);
        setStatusMsg(res.data.msg);
      } catch (error) {
        setIsError(true);
        setStatusMsg(error.response.data.error || "Unable to activate account");
      } finally {
        setLoading(false);
      }
    };
    activateUser();
  }, [uid, token]);

  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      {loading ? <CircularProgress /> : (
        isError ? <Alert severity="error">{statusMsg}</Alert> :
        <Alert severity="success">{statusMsg}</Alert>
      )}
      <Typography mt={2}>
  {isError ? (
    'Try again with the same link'
  ) : (
    <>
      You can now log in to your account.
      <Link to="/login" className="btn btn-primary ms-2 mt-2"> Login</Link>
    </>
  )}
</Typography>

    </Box>
  );
};

export default ActivateAccount;
