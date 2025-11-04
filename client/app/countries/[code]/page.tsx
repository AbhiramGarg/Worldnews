import React from 'react'

const CountryNews = async ({params}: {params: Promise<{code: string}>}) => {
    const {code} = await params;
  return (
    <div>Country News for {code}</div>
  )
}

export default CountryNews