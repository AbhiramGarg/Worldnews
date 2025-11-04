import React from 'react'

const TopicNews = async ({params}: {params: Promise<{topic: string}>}) => {
    const {topic} = await params;
  return (
    <div>World News for {topic}</div>
  )
}

export default TopicNews