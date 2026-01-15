import requests
import re
import urllib.parse

class YouTubeService:
    def search_videos(self, query: str, limit: int = 5):
        try:
            print(f"DEBUG: Searching YouTube for: {query}")
            encoded_query = urllib.parse.quote(query)
            # Use 'sp=EgIQAQ%253D%253D' to filter for videos only (EgIQAQ== base64 for 'video')
            url = f"https://www.youtube.com/results?search_query={encoded_query}&sp=EgIQAQ%253D%253D"
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
            
            response = requests.get(url, headers=headers)
            html = response.text
            
            # Robust regex to extract video data
            # Look for videoId and title in the initial data
            video_ids = re.findall(r'"videoId":"(.*?)"', html)
            
            # Remove duplicates while preserving order
            unique_ids = []
            for vid in video_ids:
                if vid not in unique_ids and len(vid) == 11: # Standard YouTube ID length
                    unique_ids.append(vid)
            
            videos = []
            for vid in unique_ids[:limit]:
                # We can't easily get exact duration/viewcount from regex without complex parsing
                # But we can reconstruct the link and thumbnail cleanly.
                videos.append({
                    'id': vid,
                    'title': f"Watch on YouTube: {query} (Result)", # Placeholder title if regex fails
                    'link': f"https://www.youtube.com/watch?v={vid}",
                    'thumbnail': f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                    'duration': "Unknown",
                    'channel': "YouTube",
                    'viewCount': "N/A"
                })

            # Attempt continuously better title extraction
            # This is fragile but better than nothing
            # Extracting title requires parsing the complex JSON embedded in the HTML.
            # For simplicity/robustness, we trust the link and thumbnail are enough for MVP.
            
            # Better Approach:
            # The 'videoRenderer' JSON object contains all details.
            # We can find the JSON blobs.
            
            try:
                # Find all videoRenderer blocks
                renderers = re.findall(r'\{"videoRenderer":\{(.*?)\}\}', html)
                detailed_videos = []
                for renderer_json in renderers[:limit]:
                    # Quick and dirty extraction from the JSON string fragment
                    vid_match = re.search(r'"videoId":"(.*?)"', renderer_json)
                    title_match = re.search(r'"title":\{"runs":\[\{"text":"(.*?)"\}\]', renderer_json)
                    view_match = re.search(r'"viewCountText":\{"simpleText":"(.*?)"\}', renderer_json)
                    length_match = re.search(r'"lengthText":\{"accessibility":.*?,"simpleText":"(.*?)"\}', renderer_json)
                    channel_match = re.search(r'"ownerText":\{"runs":\[\{"text":"(.*?)"', renderer_json)

                    if vid_match:
                        vid = vid_match.group(1)
                        detailed_videos.append({
                            'id': vid,
                            'title': title_match.group(1) if title_match else f"Result for {query}",
                            'link': f"https://www.youtube.com/watch?v={vid}",
                            'thumbnail': f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                            'duration': length_match.group(1) if length_match else "Video",
                            'channel': channel_match.group(1) if channel_match else "YouTube",
                            'viewCount': view_match.group(1) if view_match else "Views N/A"
                        })
                
                if detailed_videos:
                    return detailed_videos

            except Exception as parse_e:
                print(f"Regex parsing failed, falling back to simple IDs: {parse_e}")
                
            return videos
            
        except Exception as e:
            print(f"Error searching YouTube for '{query}': {e}")
            return []
