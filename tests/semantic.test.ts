import { SemanticScholarRetriever } from '../backend/search_client/retrievers/semantic';

async function testSemanticScholarRetriever() {
  const retriever = await SemanticScholarRetriever.create();
  const topics = [
    'machine learning',
    'natural language processing',
    'deep learning',
    'artificial intelligence',
    'computer vision'
  ];
  for (const topic of topics) {
    const results = await retriever.search({
      project_title: topic,
      queries: [],
      keywords: [],
      options: { maxResults: 5 }
    });
    console.log(`\nQuery: ${topic}`);
    console.log('Semantic Scholar Results:', results);
  }
}

testSemanticScholarRetriever(); 