import { NcbiNihRetriever } from '../backend/search_client/retrievers/ncbi_nih';

async function testNcbiNihRetriever() {
  const retriever = await NcbiNihRetriever.create();
  const topics = [
    'AI-Driven Cybersecurity: Advancing Threat Detection and Response Through Machine Learning',
    'cybersecurity machine learning',
    'AI threat detection',
    'deep learning',
    'blockchain security'
  ];
  for (const topic of topics) {
    const results = await retriever.search({project_title: topic, queries: [], keywords: [], options: { maxResults: 10 } });
    console.log(`\nQuery: ${topic}`);
    console.log('NCBI/NIH Results:', results);
  }
}

testNcbiNihRetriever(); 