import PageLayout from '../components/layout/PageLayout';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import React, { useState, useEffect } from 'react';

export default function Index() {
  const [showAlert, setShowAlert] = useState(() => {
    return localStorage.getItem('aiAgentAlertDismissed') !== 'true';
  });

  useEffect(() => {
    if (!showAlert) {
      localStorage.setItem('aiAgentAlertDismissed', 'true');
    }
  }, [showAlert]);

  return (
    <PageLayout>
      {showAlert && (
        <Alert style={{backgroundColor: '#e7f3fe', color: '#2176bd', border: '1px solid #b3d8fd', position: 'relative'}}>
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Please go to <Link to="/settings"><b> Settings </b></Link> to set up an AI agent for this app to work properly.
          </AlertDescription>
          <Button
            size="sm"
            variant="ghost"
            style={{ position: 'absolute', top: 8, right: 8 }}
            onClick={() => setShowAlert(false)}
            aria-label="Close alert"
          >
            ×
          </Button>
        </Alert>
      )}
    </PageLayout>
  );
} 