import React from 'react';

type Props = { src?: string; alt?: string };

export default function Icon({ src, alt }: Props) {
  const [error, setError] = React.useState(false);
  const resolved = src && !error ? src : '/assets/icons/placeholder.svg';
  return (
    <div className="icon">
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img src={resolved} alt={alt ?? ''} width={32} height={32} onError={() => setError(true)} />
    </div>
  );
}