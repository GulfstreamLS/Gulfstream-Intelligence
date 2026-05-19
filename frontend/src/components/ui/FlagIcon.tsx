// Maps authority name → ISO 3166-1 alpha-2 country code for flagcdn.com
export const AUTHORITY_COUNTRY_CODE: Record<string, string> = {
  FDA:             "us",
  EMA:             "eu",
  MHRA:            "gb",
  "Health Canada": "ca",
  PMDA:            "jp",
  NMPA:            "cn",
  TGA:             "au",
};

interface FlagIconProps {
  code: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function FlagIcon({ code, size = 24, className = "", alt = "" }: FlagIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt={alt || code.toUpperCase()}
      width={size}
      height={Math.round(size * 0.67)}
      style={{ width: size, height: "auto", display: "inline-block", flexShrink: 0 }}
      className={`${className}`}
    />
  );
}

export function AuthorityFlag({
  authority,
  size = 24,
  className = "",
}: {
  authority: string;
  size?: number;
  className?: string;
}) {
  const code = AUTHORITY_COUNTRY_CODE[authority];
  if (!code) return null;
  return <FlagIcon code={code} size={size} alt={authority} className={className} />;
}
