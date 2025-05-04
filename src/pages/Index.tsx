import PageLayout from '../components/layout/PageLayout';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <PageLayout>
      <Alert style={{backgroundColor: '#e7f3fe', color: '#2176bd', border: '1px solid #b3d8fd'}}>
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>
          Please go to <Link to="/settings"><b> Settings </b></Link> to set up an AI agent for this app to work properly.
        </AlertDescription>
      </Alert>
    </PageLayout>
  );
} 