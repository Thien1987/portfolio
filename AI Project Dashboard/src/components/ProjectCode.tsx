export function ProjectCode({ code, className = '' }: { code: string; className?: string }) {
  return <span className={`project-code-chip ${className}`}>{code}</span>
}
