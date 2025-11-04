import Link from 'next/link'
import React from 'react'
const topics = ['Business','Politics','Sports','Fashion','Nature']
const page = () => {
  return (
    <div>
        <h1>Topic Wise News</h1>
        <ul>
            {topics.map((topic) => (
          <li key={topic} style={{ marginBottom: '5px' }}>
            <Link href={`/topics/${topic}`} passHref style={{ textDecoration: 'none', color: 'blue' }}>
                {topic}
            </Link>
          </li>
        ))}
        </ul>
    </div>
  )
}

export default page