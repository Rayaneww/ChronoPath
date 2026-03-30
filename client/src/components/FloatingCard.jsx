export default function FloatingCard({ children, className = '' }) {
  return (
    <div className={`float-card ${className}`.trim()}>
      <div className="float-card-handle" />
      {children}
    </div>
  );
}
