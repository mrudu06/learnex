from youtube_service import YouTubeService
import json

def test():
    service = YouTubeService()
    query = "Master-Slave JK flip-flop operation and race around condition elimination tutorial"
    print(f"Testing search for: {query}")
    
    results = service.search_videos(query, limit=3)
    
    print("\n--- Results ---")
    print(json.dumps(results, indent=2))
    
    if results:
        print(f"\nSUCCESS: Found {len(results)} videos.")
    else:
        print("\nFAILURE: No videos found.")

if __name__ == "__main__":
    test()
