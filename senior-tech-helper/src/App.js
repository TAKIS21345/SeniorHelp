import { useState } from 'react';
import {
  Webchat,
  Fab,
  getClient,
} from '@botpress/webchat';

const clientId = "9a1566ce-abb9-4be0-8ce2-0867aaf67b5a";

const configuration = {
  color: '#000',
};

export default function App() {
  const client = getClient({
    clientId,
  });

  const [isWebchatOpen, setIsWebchatOpen] = useState(false);

  const toggleWebchat = () => {
    setIsWebchatOpen((prevState) => !prevState);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Fab onClick={toggleWebchat} />
      <div
        style={{
          display: isWebchatOpen ? 'block' : 'none',
        }}
      >
        <Webchat client={client} configuration={configuration} />
      </div>
    </div>
  );
}
