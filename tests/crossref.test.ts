import { CrossrefClient, QueryWorksParams, WorkSelectOptions, Work } from "@jamesgopsill/crossref-client";

async function testCrossrefClient() {
  try {
    // Initialize client without API key for testing
    const client = new CrossrefClient();

    // Test search parameters
    const searchParams: QueryWorksParams = {
      query: "machine learning",
      rows: 2,
      select: [
        WorkSelectOptions.DOI,
        WorkSelectOptions.TITLE,
        WorkSelectOptions.PUBLISHED,
        WorkSelectOptions.AUTHOR,
        WorkSelectOptions.ABSTRACT
      ]
    };

    console.log("Searching with params:", searchParams);
    const response = await client.works(searchParams);

    if (response.ok && response.status === 200) {
      console.log("\nResponse structure:");
      console.log("Status:", response.status);
      console.log("OK:", response.ok);
      console.log("\nContent type:", typeof response.content);
      console.log("Content keys:", Object.keys(response.content));
      
      // The actual items are in response.content.message.items
      const items = response.content.message.items;
      if (items && items.length > 0) {
        console.log("\nFirst item structure:");
        console.log(JSON.stringify(items[0], null, 2));
      }
    } else {
      console.error("Error response:", response);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testCrossrefClient().catch(console.error); 