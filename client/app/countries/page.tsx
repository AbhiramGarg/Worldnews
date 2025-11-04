import Link from 'next/link'
import React from 'react'

const countries = [
  { code: 'US', name: 'United States of America' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'RU', name: 'Russia' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', 'name': 'Spain' },
  { code: 'IL', name: 'Israel' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SE', name: 'Sweden' },
  { code: 'IE', name: 'Ireland' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'PL', name: 'Poland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'RO', name: 'Romania' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CL', name: 'Chile' },
  { code: 'GR', name: 'Greece' },
  { code: 'DK', name: 'Denmark' },
  { code: 'IR', name: 'Iran' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
];


const page = () => {
  return (
    <div>
      <h2>Globally Active Countries</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {countries.map((country) => (
          <li key={country.code} style={{ marginBottom: '5px' }}>
            {/* The 'href' attribute correctly generates the URL path for the link.
              In a Next.js dynamic route (e.g., pages/countries/[code].js), 
              clicking this link will navigate to /countries/US, /countries/CN, etc.
            */}
            <Link href={`/countries/${country.code}`} passHref style={{ textDecoration: 'none', color: 'blue' }}>
                **{country.name}** ({country.code})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default page