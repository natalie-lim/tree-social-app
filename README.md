https://youtube.com/shorts/x02C_-sguE8?si=EVzYcAk_wLhx1Png
https://youtube.com/shorts/Z95SXjZivyo?si=sIdJMwxviFe4s6LZ

# Leaflet

## Inspiration
This summer, while visiting a new area, we realized how fragmented information about the outdoors really is. Finding trails and hikes meant bouncing between Google Maps, blogs, and scattered review sites — none of which gave a complete picture or felt tailored to real explorers. There was no centralized place where people could easily discover, save, and share outdoor spots with friends.

That gap inspired **Leaflet**: a community-driven hub for all things outdoors. Leaflet makes it simple to uncover trails, parks, and hidden gems — and makes every adventure social. See where your friends are going, share notes and tips, leave likes and comments, and build a living map of experiences together.

## What it does
Leaflet makes exploring the outdoors simple, social, and fun. Users can:
- Search through National Park Service locations with descriptions, images, and details.
- Rank their experiences through comparisons that generate a unique numerical score.
- Follow friends to see their latest adventures, leave likes and comments, and bookmark places to visit.
- Use an interactive map to discover trails, parks, and outdoor gems nearby.
- Compete on a leaderboard that gamifies exploration and highlights the most active Leaflet users.

## How we built it
- **Frontend:** [Expo Go](https://expo.dev/) + React Native for mobile development.
- **Backend:** Firebase (Firestore Database + Authentication).
- **Design:** Figma for layout and UI/UX design.
- **Data:** National Park Service API (pre-processed into hikes/trails/spots).

We set up user relationships in Firebase to create a dynamic and agile backend. On the frontend, we integrated authentication, ranking, liking, and commenting, all tied seamlessly to the backend. We also integrated the Google Maps API with custom map pins and interactions to provide an intuitive experience.

## Individual Contributions
- **Evelyn:** Built the Firebase database and backend, pulled National Park Service API data, and established user–spot–ranking relationships.  
- **Christian & Grace:** Designed the app interface, color palette, and map UI using React Native.  
- **Natalie:** Integrated frontend with backend and implemented user–user relationships.  

## Challenges we ran into
- Our first time using the Maps API — customizing location markers with plant icons was difficult.  
- First time using Firebase for many of us, which made integration unexpectedly challenging.  

## Accomplishments that we're proud of
- Built a comprehensive app with an intuitive, aesthetically pleasing frontend we would genuinely use.  
- Successfully structured user relationships and location information in Firebase to keep the app scalable and reliable.  

## What we learned
- Tackling challenges as a team and focusing on individual strengths allowed us to work efficiently and effectively.  

## What's next
- Expand the friending system to let people find friends via contacts.  
- Improve gamification and leaderboard features to incentivize ranking more locations and exploring communities further.  
