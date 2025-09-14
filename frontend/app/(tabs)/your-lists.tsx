import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView, Modal, Platform, Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { getCurrentPlace } from "../../location";


const PALETTE = {
 bg: "#F7F1E8",
 card: "#FFFFFF",
 text: "#3E3E3E",
 subtext: "#6F7B6F",
 accent: "#6FA076",
 accentDark: "#5C8B64",
 divider: "#E6E0D6",
 chipBg: "#F8F4EE",
 faint: "#F1EFE9",
 ink: "#1F2D1F",
};


type CategoryBase =
 | "Casual Outdoors"
 | "Adventure Activities"
 | "Parks & Nature Spots"
 | "Hikes & Trails"
 | "Wildlife & Nature Logs";
type Category = "All Places" | CategoryBase;


const BASE_CATEGORIES: CategoryBase[] = [
 "Casual Outdoors",
 "Adventure Activities",
 "Parks & Nature Spots",
 "Hikes & Trails",
 "Wildlife & Nature Logs",
];
const CATEGORY_CHOICES: Category[] = ["All Places", ...BASE_CATEGORIES];


type TabKey = "Been" | "Have Been" | "Want to Go";
type HikeTrailType = "loop" | "out-and-back" | "point-to-point";
type HikeDifficulty = "easy" | "moderate" | "hard";


type Item = {
 id: string;
 name: string;
 location: string;
 score: number;
 tags?: string;
 _category: CategoryBase;
 difficulty?: HikeDifficulty;
 trailType?: HikeTrailType;
 distanceMi?: number;
 isOpen?: boolean;
 opensAt?: string;
};


const mk = (
 p: Partial<Item> & Pick<Item, "id" | "name" | "location" | "score" | "_category">
): Item =>
 ({
   tags: "",
   distanceMi: 5,
   isOpen: true,
   opensAt: "9:00 AM Mon",
   ...p,
 } as Item);


// ----------------- DATASETS -----------------
const DATA_BEEN: Record<CategoryBase, Item[]> = {
 "Casual Outdoors": [
   mk({ id: "b-co1", name: "Charles River Esplanade", location: "Boston, MA", score: 9.3, tags: "picnic • riverfront", _category: "Casual Outdoors" }),
   mk({ id: "b-co2", name: "Grizzly Peak Lookout", location: "Berkeley, CA", score: 9.1, tags: "scenic • sunset", _category: "Casual Outdoors" }),
   mk({ id: "b-co3", name: "Baker Beach", location: "San Francisco, CA", score: 8.8, tags: "scenic • coastal", _category: "Casual Outdoors" }),
 ],
 "Adventure Activities": [
   mk({ id: "b-aa1", name: "Castle Rock Boulders", location: "Los Gatos, CA", score: 9.2, tags: "climbing • sandstone", _category: "Adventure Activities" }),
   mk({ id: "b-aa2", name: "Tamarancho Flow Trail", location: "Fairfax, CA", score: 9.0, tags: "mtb • flow", _category: "Adventure Activities" }),
   mk({ id: "b-aa3", name: "La Jolla Shores", location: "San Diego, CA", score: 8.9, tags: "surf/swim • gentle break", _category: "Adventure Activities" }),
 ],
 "Parks & Nature Spots": [
   mk({ id: "b-pn1", name: "Muir Woods National Monument", location: "Mill Valley, CA", score: 9.6, tags: "redwoods • national", _category: "Parks & Nature Spots" }),
   mk({ id: "b-pn2", name: "Prospect Park Long Meadow", location: "Brooklyn, NY", score: 9.0, tags: "city park • open fields", _category: "Parks & Nature Spots" }),
   mk({ id: "b-pn3", name: "Arnold Arboretum", location: "Boston, MA", score: 8.9, tags: "arboretum • gardens", _category: "Parks & Nature Spots" }),
 ],
 "Hikes & Trails": [
   mk({ id: "b-ht1", name: "Mt. Tam East Peak", location: "Mill Valley, CA", score: 9.4, tags: "summit views", _category: "Hikes & Trails", difficulty: "moderate", trailType: "loop" }),
   mk({ id: "b-ht2", name: "Rattlesnake Ledge", location: "North Bend, WA", score: 9.0, tags: "lake views", _category: "Hikes & Trails", difficulty: "moderate", trailType: "out-and-back" }),
   mk({ id: "b-ht3", name: "Walden Pond Loop", location: "Concord, MA", score: 8.7, tags: "easy • lake", _category: "Hikes & Trails", difficulty: "easy", trailType: "loop" }),
 ],
 "Wildlife & Nature Logs": [
   mk({ id: "b-wl1", name: "Crissy Field Marsh", location: "San Francisco, CA", score: 9.1, tags: "birdwatching • shorebirds", _category: "Wildlife & Nature Logs" }),
   mk({ id: "b-wl2", name: "High Island Rookery", location: "Galveston, TX", score: 9.0, tags: "rookery • spring best", _category: "Wildlife & Nature Logs" }),
   mk({ id: "b-wl3", name: "Skagit Valley Tulips", location: "Mount Vernon, WA", score: 8.8, tags: "wildflowers • seasonal", _category: "Wildlife & Nature Logs" }),
 ],
};


const DATA_HAVE_BEEN: Record<CategoryBase, Item[]> = {
 "Casual Outdoors": [
   mk({ id: "hb-co1", name: "Lake Merritt Loop", location: "Oakland, CA", score: 8.9, tags: "running • lakeside", _category: "Casual Outdoors" }),
   mk({ id: "hb-co2", name: "Nahant Beach Walk", location: "Nahant, MA", score: 8.6, tags: "coastal • boardwalk", _category: "Casual Outdoors" }),
   mk({ id: "hb-co3", name: "Griffith Observatory Lawn", location: "Los Angeles, CA", score: 8.5, tags: "views • picnic", _category: "Casual Outdoors" }),
 ],
 "Adventure Activities": [
   mk({ id: "hb-aa1", name: "Mission Bay Kayak", location: "San Diego, CA", score: 8.7, tags: "kayak/canoe", _category: "Adventure Activities" }),
   mk({ id: "hb-aa2", name: "Northstar Ski Area", location: "Truckee, CA", score: 8.6, tags: "ski/snowboard", _category: "Adventure Activities" }),
   mk({ id: "hb-aa3", name: "Hudson River Greenway Ride", location: "New York, NY", score: 8.4, tags: "biking • path", _category: "Adventure Activities" }),
 ],
 "Parks & Nature Spots": [
   mk({ id: "hb-pn1", name: "Golden Gate Park Concourse", location: "San Francisco, CA", score: 8.8, tags: "city park • plaza", _category: "Parks & Nature Spots" }),
   mk({ id: "hb-pn2", name: "Blue Hills Reservation", location: "Milton, MA", score: 8.6, tags: "state park", _category: "Parks & Nature Spots" }),
   mk({ id: "hb-pn3", name: "Fresh Pond Reservation", location: "Cambridge, MA", score: 8.5, tags: "loop • dog friendly", _category: "Parks & Nature Spots" }),
 ],
 "Hikes & Trails": [
   mk({ id: "hb-ht1", name: "Stinson to Dipsea Loop", location: "Stinson Beach, CA", score: 9.0, tags: "coastal • stairs", _category: "Hikes & Trails", difficulty: "hard", trailType: "loop" }),
   mk({ id: "hb-ht2", name: "Franconia Ridge", location: "Lincoln, NH", score: 9.1, tags: "alpine • ridge", _category: "Hikes & Trails", difficulty: "hard", trailType: "point-to-point" }),
   mk({ id: "hb-ht3", name: "Quarry Run", location: "Acton, MA", score: 8.2, tags: "woods • easy", _category: "Hikes & Trails", difficulty: "easy", trailType: "out-and-back" }),
 ],
 "Wildlife & Nature Logs": [
   mk({ id: "hb-wl1", name: "Palo Alto Baylands", location: "Palo Alto, CA", score: 8.7, tags: "birdwatching • marsh", _category: "Wildlife & Nature Logs" }),
   mk({ id: "hb-wl2", name: "Jamaica Bay Refuge", location: "Queens, NY", score: 8.6, tags: "shorebirds • migratory", _category: "Wildlife & Nature Logs" }),
   mk({ id: "hb-wl3", name: "Horicon Marsh", location: "Dodge County, WI", score: 8.5, tags: "waterfowl • refuge", _category: "Wildlife & Nature Logs" }),
 ],
};


const DATA_WANT_TO_GO: Record<CategoryBase, Item[]> = {
 "Casual Outdoors": [
   mk({ id: "wb-co1", name: "Kerry Park Lookout", location: "Seattle, WA", score: 9.2, tags: "iconic • skyline", _category: "Casual Outdoors" }),
   mk({ id: "wb-co2", name: "Runyon Canyon Loop", location: "Los Angeles, CA", score: 9.0, tags: "views • dog-friendly", _category: "Casual Outdoors" }),
   mk({ id: "wb-co3", name: "Storm King Overlook", location: "Cornwall, NY", score: 8.8, tags: "hudson valley • lookout", _category: "Casual Outdoors" }),
 ],
 "Adventure Activities": [
   mk({ id: "wb-aa1", name: "Moab Slickrock", location: "Moab, UT", score: 9.5, tags: "mtb • iconic", _category: "Adventure Activities" }),
   mk({ id: "wb-aa2", name: "Smith Rock State Park", location: "Terrebonne, OR", score: 9.3, tags: "sport climbing", _category: "Adventure Activities" }),
   mk({ id: "wb-aa3", name: "Waimea Bay", location: "Oahu, HI", score: 9.1, tags: "surf/swim • seasonal", _category: "Adventure Activities" }),
 ],
 "Parks & Nature Spots": [
   mk({ id: "wb-pn1", name: "Zion National Park", location: "Springdale, UT", score: 9.7, tags: "canyons • national", _category: "Parks & Nature Spots" }),
   mk({ id: "wb-pn2", name: "Acadia National Park", location: "Bar Harbor, ME", score: 9.6, tags: "coastal • granite", _category: "Parks & Nature Spots" }),
   mk({ id: "wb-pn3", name: "Olympic National Park", location: "Port Angeles, WA", score: 9.5, tags: "rainforest • coast", _category: "Parks & Nature Spots" }),
 ],
 "Hikes & Trails": [
   mk({ id: "wb-ht1", name: "Half Dome (Cables)", location: "Yosemite, CA", score: 9.8, tags: "permit • iconic", _category: "Hikes & Trails", difficulty: "hard", trailType: "out-and-back" }),
   mk({ id: "wb-ht2", name: "Angels Landing", location: "Zion NP, UT", score: 9.6, tags: "exposed • chain", _category: "Hikes & Trails", difficulty: "hard", trailType: "out-and-back" }),
   mk({ id: "wb-ht3", name: "Glacier Point via Four Mile", location: "Yosemite, CA", score: 9.3, tags: "switchbacks • views", _category: "Hikes & Trails", difficulty: "hard", trailType: "out-and-back" }),
 ],
 "Wildlife & Nature Logs": [
   mk({ id: "wb-wl1", name: "Bosque del Apache", location: "San Antonio, NM", score: 9.4, tags: "sandhill cranes • winter", _category: "Wildlife & Nature Logs" }),
   mk({ id: "wb-wl2", name: "Point Reyes Elk Reserve", location: "Point Reyes, CA", score: 9.2, tags: "tule elk • rut", _category: "Wildlife & Nature Logs" }),
   mk({ id: "wb-wl3", name: "Haines Bald Eagle Gather", location: "Haines, AK", score: 9.1, tags: "eagle gathering • fall", _category: "Wildlife & Nature Logs" }),
 ],
};


const DATA_BY_TAB: Record<TabKey, Record<CategoryBase, Item[]>> = {
 Been: DATA_BEEN,
 "Have Been": DATA_HAVE_BEEN,
 "Want to Go": DATA_WANT_TO_GO,
};


// UI bits
const ScoreBadge = ({ score }: { score: number }) => (
 <View style={styles.scoreBadge}><Text style={styles.scoreText}>{score.toFixed(1)}</Text></View>
);


const RowMeta = ({ it }: { it: Item }) => {
 const parts: string[] = [];
 if (typeof it.distanceMi === "number") parts.push(`${it.distanceMi} mi`);
 parts.push(it.isOpen ? "Open" : "Closed");
 if (!it.isOpen && it.opensAt) parts.push(`Opens ${it.opensAt}`);
 return <Text style={styles.metaLine}>{parts.join(" • ")}</Text>;
};


const ItemRow = ({ it, rank }: { it: Item; rank: number }) => (
 <View style={styles.itemCard}>
   <View style={styles.itemRowTop}>
     <View style={styles.itemLeft}>
       <Text style={styles.rank}>{rank}.</Text>
       <View style={{ flex: 1 }}>
         <Text style={styles.itemName}>{it.name}</Text>
         {!!it.tags && <Text style={styles.itemTags}>{it.tags}</Text>}
         <Text style={styles.itemLocation}>📍 {it.location}</Text>
         <RowMeta it={it} />
         <Text style={styles.itemCat}>— {it._category}</Text>
       </View>
     </View>
     <ScoreBadge score={it.score} />
   </View>
 </View>
);


// filters
type SortKey = "score" | "distance";
type SortDir = "asc" | "desc";


function useFilters() {
 const [minScore, setMinScore] = useState<number>(0);
 const [difficulty, setDifficulty] = useState<HikeDifficulty | "">("");
 const [trailType, setTrailType] = useState<HikeTrailType | "">("");
 const [cities, setCities] = useState<string[]>([]);
 const [sortBy, setSortBy] = useState<SortKey>("score");
 const [sortDir, setSortDir] = useState<SortDir>("desc");


 const toggleSort = (key: SortKey) => {
   if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
   else {
     setSortBy(key);
     setSortDir(key === "score" ? "desc" : "asc");
   }
 };


 return {
   values: { minScore, difficulty, trailType, cities, sortBy, sortDir },
   setMinScore, setDifficulty, setTrailType, setCities, setSortBy, setSortDir,
   toggleSort,
   clear: () => {
     setMinScore(0); setDifficulty(""); setTrailType(""); setCities([]);
     setSortBy("score"); setSortDir("desc");
   },
 };
}


const Checkbox = ({ checked }: { checked: boolean }) => (
 <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
   {checked ? <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text> : null}
 </View>
);


const CITY_OPTIONS = [
 "Boston, MA","Cambridge, MA","Somerville, MA","Berkeley, CA","San Francisco, CA",
 "Mill Valley, CA","North Bend, WA","Concord, MA","Brooklyn, NY","Los Gatos, CA","Fairfax, CA","San Diego, CA",
];


// Filter sheet
const FilterSheet = ({
 visible, onClose, filters, onApply, category,
}: {
 visible: boolean; onClose: () => void;
 filters: ReturnType<typeof useFilters>;
 onApply: () => void;
 category: Category;
}) => {
 // DRAFT copy mirrors real filters when opening
 const [draft, setDraft] = React.useState(() => ({ ...filters.values }));
 React.useEffect(() => {
   if (visible) setDraft({ ...filters.values });
 }, [visible, filters.values]);


 const setDraftVal = <K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) =>
   setDraft((d) => ({ ...d, [key]: val }));


 const [citySearch, setCitySearch] = React.useState("");
 const filteredCities = React.useMemo(() => {
   const q = citySearch.trim().toLowerCase();
   return CITY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
 }, [citySearch]);


 const toggleCity = (name: string) => {
   const cur = draft.cities;
   setDraftVal("cities", cur.includes(name) ? cur.filter((c) => c !== name) : [...cur, name]);
 };


 const pickCurrentLocation = async () => {
   const place = await getCurrentPlace();
   if (!place) return;
   const label =
     place.city && place.region ? `${place.city}, ${place.region}` : place.city || "Current Location : " + `${place.city}, ${place.region}`;
   const cur = draft.cities;
   if (!cur.includes(label)) setDraftVal("cities", [...cur, label]);
 };


 const hikeFiltersEnabled = category === "Hikes & Trails" || category === "All Places";


 const toggleSortDraft = (key: SortKey) => {
   if (key === draft.sortBy) {
     setDraftVal("sortDir", draft.sortDir === "asc" ? "desc" : "asc");
   } else {
     setDraftVal("sortBy", key);
     setDraftVal("sortDir", key === "score" ? "desc" : "asc");
   }
 };


 const clearDraft = () => {
   setDraft({
     minScore: 0,
     difficulty: "",
     trailType: "",
     cities: [],
     sortBy: "score",
     sortDir: "desc",
   });
 };


 const commitAndClose = () => {
   // commit draft to real filters
   filters.setMinScore(draft.minScore);
   filters.setDifficulty(draft.difficulty);
   filters.setTrailType(draft.trailType);
   filters.setCities(draft.cities);
   filters.setSortBy(draft.sortBy);
   filters.setSortDir(draft.sortDir);
   onApply();
 };


 return (
   <Modal
     transparent
     visible={visible}
     animationType="slide"
     onRequestClose={onClose} // Android back
   >
     {/* backdrop */}
     <Pressable style={styles.sheetBackdrop} onPress={onClose} />


     {/* bottom sheet */}
     <KeyboardAvoidingView
       behavior={Platform.select({ ios: "padding", android: undefined })}
       style={styles.sheetKEV}
     >
       <SafeAreaView style={styles.sheet}>
         <View style={styles.grabber} />


         {/* Column: scrollable body + sticky footer */}
         <View style={styles.sheetContent}>
           {/* BODY (scrollable) */}
           <View style={styles.sheetBody}>
             <ScrollView
               style={{ flex: 1 }}
               contentContainerStyle={{ paddingBottom: 16 }}
               showsVerticalScrollIndicator
               keyboardShouldPersistTaps="handled"
             >
               {/* Sort */}
               <Text style={styles.sheetHeading}>Sort by</Text>
               <View style={styles.sortTabs}>
                 {(["score","distance"] as SortKey[]).map((k) => {
                   const active = draft.sortBy === k;
                   const dir = active ? (draft.sortDir === "asc" ? "↑" : "↓") : "";
                   return (
                     <TouchableOpacity
                       key={k}
                       onPress={() => toggleSortDraft(k)}
                       style={[styles.sortTab, active && styles.sortTabActive]}
                       activeOpacity={0.9}
                     >
                       <Text style={[styles.sortTabText, active && styles.sortTabTextActive]}>
                         {k === "score" ? "Score" : "Distance"} {dir}
                       </Text>
                     </TouchableOpacity>
                   );
                 })}
               </View>


               {/* Quick chip */}
               <Text style={styles.sheetHeading}>Filters</Text>
               <View style={styles.chipsRow}>
                 <TouchableOpacity
                   onPress={() =>
                     setDraftVal("minScore", draft.minScore === 0 ? 8 : draft.minScore === 8 ? 9 : 0)
                   }
                   style={styles.filterChip}
                   activeOpacity={0.85}
                 >
                   <Text style={styles.filterChipText}>Score ≥ {draft.minScore}</Text>
                 </TouchableOpacity>
               </View>


               {/* City */}
               <View style={styles.section}>
                 <View style={styles.sectionHeader}>
                   <Text style={styles.sectionTitle}>
                     🏙️  City{draft.cities.length ? ` (${draft.cities.length})` : ""}
                   </Text>
                   {!!draft.cities.length && (
                     <TouchableOpacity onPress={() => setDraftVal("cities", [])}>
                       <Text style={styles.clearInline}>×</Text>
                     </TouchableOpacity>
                   )}
                 </View>


                 <View style={styles.searchBox}>
                   <Text style={styles.searchIcon}>🔍</Text>
                   <TextInput
                     placeholder="Search City"
                     placeholderTextColor="#9AA29A"
                     style={styles.searchInput}
                     value={citySearch}
                     onChangeText={setCitySearch}
                   />
                 </View>


                 <TouchableOpacity style={styles.cityRow} onPress={pickCurrentLocation}>
                   <Text style={styles.cityLead}>📍 Current Location: </Text>
                   <Checkbox checked={false} />
                 </TouchableOpacity>


                 {filteredCities.map((c) => (
                   <TouchableOpacity key={c} style={styles.cityRow} onPress={() => toggleCity(c)}>
                     <Text style={styles.cityName}>{c}</Text>
                     <Checkbox checked={draft.cities.includes(c)} />
                   </TouchableOpacity>
                 ))}
               </View>


               {/* Hike options */}
               {hikeFiltersEnabled && (
                 <View style={styles.section}>
                   <Text style={styles.sectionTitle}>🥾 Hike options</Text>
                   <View style={styles.hikeRow}>
                     <Text style={styles.hikeLabel}>Difficulty</Text>
                     <SelectPills
                       options={["", "easy", "moderate", "hard"]}
                       value={draft.difficulty}
                       onChange={(v) => setDraftVal("difficulty", v as HikeDifficulty | "")}
                     />
                   </View>
                   <View style={styles.hikeRow}>
                     <Text style={styles.hikeLabel}>Trail type</Text>
                     <SelectPills
                       options={["", "loop", "out-and-back", "point-to-point"]}
                       value={draft.trailType}
                       onChange={(v) => setDraftVal("trailType", v as HikeTrailType | "")}
                     />
                   </View>
                 </View>
               )}
             </ScrollView>
           </View>


           {/* FOOTER (sticky) */}
           <View style={styles.sheetFooter}>
             <TouchableOpacity onPress={clearDraft} hitSlop={8}>
               <Text style={styles.clearAll}>Clear filters</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={commitAndClose} style={styles.applyBtn} activeOpacity={0.9}>
               <Text style={styles.applyText}>Apply</Text>
             </TouchableOpacity>
           </View>
         </View>
       </SafeAreaView>
     </KeyboardAvoidingView>
   </Modal>
 );
};


const SelectPills = ({
 options, value, onChange,
}: { options: string[]; value?: string | ""; onChange: (v: string) => void }) => (
 <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
   {options.map((opt) => {
     const label =
       opt === ""
         ? "Any"
         : opt === "out-and-back"
         ? "Out-and-Back"
         : opt === "point-to-point"
         ? "Point-to-Point"
         : opt[0].toUpperCase() + opt.slice(1);
     const active = value === opt;
     return (
       <TouchableOpacity key={opt || "any"} onPress={() => onChange(opt)} style={[styles.pill, active && styles.pillActive]}>
         <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
       </TouchableOpacity>
     );
   })}
 </View>
);


// ----- Screen -----
export default function YourLists() {
 const [tab, setTab] = useState<TabKey>("Been");
 const [category, setCategory] = useState<Category>("All Places");
 const [catOpen, setCatOpen] = useState(false);


 const filters = useFilters();
 const [sheetOpen, setSheetOpen] = useState(false);


 const dataset = DATA_BY_TAB[tab];
 const rawItems: Item[] = useMemo(() => {
   if (category === "All Places") return BASE_CATEGORIES.flatMap((c) => dataset[c]);
   return dataset[category];
 }, [tab, category]);


 // apply filters + sort
 const filtered = useMemo(() => {
   let list = [...rawItems];
   list = list.filter((it) => it.score >= filters.values.minScore);


   if (filters.values.cities.length) {
     list = list.filter((it) =>
       filters.values.cities.some((c) => (c === "Current Location" ? true : it.location.includes(c)))
     );
   }
   if (filters.values.difficulty) list = list.filter((it) => it.difficulty === filters.values.difficulty);
   if (filters.values.trailType) list = list.filter((it) => it.trailType === filters.values.trailType);


   const dir = filters.values.sortDir === "asc" ? 1 : -1;
   if (filters.values.sortBy === "score") {
     list.sort((a, b) => (a.score - b.score) * dir);
   } else {
     list.sort(
       (a, b) =>
         (((a.distanceMi ?? Number.POSITIVE_INFINITY) - (b.distanceMi ?? Number.POSITIVE_INFINITY)) * dir)
     );
   }
   return list;
 }, [rawItems, filters.values]);


 // re-rank 1..N
 const items = useMemo(() => filtered.map((it, idx) => ({ it, rank: idx + 1 })), [filtered]);


 // category picker
 const CategoryPicker = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
   <Modal transparent visible={visible} animationType="fade">
     <Pressable style={styles.modalBackdrop} onPress={onClose} />
     <View style={styles.modalSheet}>
       <Text style={styles.modalTitle}>Choose category</Text>
       {CATEGORY_CHOICES.map((c) => (
         <TouchableOpacity
           key={c}
           onPress={() => { setCategory(c); onClose(); }}
           style={[styles.modalOption, category === c && styles.modalOptionActive]}
         >
           <Text style={[styles.modalOptionText, category === c && styles.modalOptionTextActive]}>{c}</Text>
         </TouchableOpacity>
       ))}
     </View>
   </Modal>
 );


 return (
   <SafeAreaView style={styles.safe}>
     <View style={styles.root}>
       <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
         <Text style={styles.kicker}>MY LISTS</Text>


         <TouchableOpacity style={styles.titlePicker} onPress={() => setCatOpen(true)} activeOpacity={0.85}>
           <Text style={styles.title}>{category}</Text>
           <Text style={styles.caret}>▾</Text>
         </TouchableOpacity>


         <View style={styles.tabsRow}>
           {(["Been","Have Been","Want to Go"] as TabKey[]).map((t) => (
             <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabBtn}>
               <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
               {tab === t && <View style={styles.underline} />}
             </TouchableOpacity>
           ))}
         </View>


         {/* Controls row */}
         <View style={styles.controlsRow}>
           <TouchableOpacity onPress={() => setSheetOpen(true)} style={styles.filterButton} activeOpacity={0.85}>
             <Text style={styles.filterIcon}>⚙️</Text>
             <Text style={styles.filterBtnText}>
               Filters
               {filters.values.cities.length ? ` • City (${filters.values.cities.length})` : ""}
               {filters.values.minScore ? ` • Score ≥ ${filters.values.minScore}` : ""}
               {(category === "All Places" || category === "Hikes & Trails") && filters.values.difficulty ? ` • ${cap(filters.values.difficulty)}` : ""}
               {(category === "All Places" || category === "Hikes & Trails") && filters.values.trailType ? ` • ${trailLabel(filters.values.trailType)}` : ""}
             </Text>
           </TouchableOpacity>


           <View style={styles.sortHint}>
             <Text style={styles.sortGlyph}>{filters.values.sortDir === "asc" ? "↑" : "↓"}</Text>
             <Text style={styles.sortText}>{filters.values.sortBy === "score" ? "Score" : "Distance"}</Text>
           </View>
         </View>


         <View>
           {items.map(({ it, rank }) => (
             <ItemRow key={it.id} it={it} rank={rank} />
           ))}
           {!items.length && (
             <View style={styles.emptyWrap}><Text style={styles.emptyText}>No items match these filters.</Text></View>
           )}
         </View>
       </ScrollView>


       <CategoryPicker visible={catOpen} onClose={() => setCatOpen(false)} />
       <FilterSheet
         visible={sheetOpen}
         onClose={() => setSheetOpen(false)}
         onApply={() => setSheetOpen(false)}
         filters={filters}
         category={category}
       />
     </View>
   </SafeAreaView>
 );
}


// helpers & styles
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const trailLabel = (t: HikeTrailType) =>
 t === "out-and-back" ? "Out-and-Back" : t === "point-to-point" ? "Point-to-Point" : "Loop";


const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor: PALETTE.bg },
 root: { flex: 1, backgroundColor: PALETTE.bg, paddingHorizontal: 14 },


 kicker: { textAlign: "center", color: "#6A6A6A", marginTop: 6, letterSpacing: 1, fontWeight: "700" },


 titlePicker: {
   marginTop: 8, flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
   backgroundColor: PALETTE.chipBg, borderWidth: 1, borderColor: PALETTE.divider,
   borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10,
 },
 title: { fontSize: 22, fontWeight: "800", color: PALETTE.text },
 caret: { marginLeft: 8, color: "#666", fontSize: 16 },


 tabsRow: { flexDirection: "row", marginTop: 12, gap: 14 },
 tabBtn: { alignItems: "center" },
 tabText: { color: "#999", fontWeight: "700" },
 tabTextActive: { color: PALETTE.text },
 underline: { marginTop: 4, height: 3, width: 28, borderRadius: 2, backgroundColor: PALETTE.text },


 controlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 12},
 filterButton: {
   flexDirection: "row", alignItems: "center", backgroundColor: PALETTE.card,
   borderWidth: 1, borderColor: PALETTE.divider, borderRadius: 20,
   paddingVertical: 8, paddingHorizontal: 12,
 },
 filterIcon: { marginRight: 6, fontSize: 16 },
 filterBtnText: { color: PALETTE.text, fontWeight: "700" },


 sortHint: { flexDirection: "row", alignItems: "center", gap: 6 },
 sortGlyph: { color: PALETTE.subtext },
 sortText: { color: PALETTE.subtext, fontWeight: "700" },


 itemCard: {
   backgroundColor: PALETTE.card, borderRadius: 12, padding: 12,
   borderWidth: 1, borderColor: PALETTE.divider, marginBottom: 10,
 },
 itemRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
 itemLeft: { flexDirection: "row", gap: 10, flex: 1 },
 rank: { fontWeight: "800", color: PALETTE.text, width: 26, textAlign: "right" },
 itemName: { fontSize: 16, fontWeight: "800", color: PALETTE.text },
 itemTags: { color: "#666", marginTop: 2 },
 itemLocation: { color: "#7A7A7A", marginTop: 2 },
 metaLine: { color: "#9B9B9B", marginTop: 6 },
 itemCat: { color: PALETTE.subtext, marginTop: 4, fontStyle: "italic" },


 scoreBadge: {
   backgroundColor: "#E9F2EB", borderWidth: 1, borderColor: "#CFE1D3",
   width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
 },
 scoreText: { color: PALETTE.accent, fontWeight: "800" },


 // simple category picker
 modalBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.2)" },
 modalSheet: {
   position: "absolute", left: 16, right: 16, top: 120,
   backgroundColor: PALETTE.card, borderRadius: 12,
   borderWidth: 1, borderColor: PALETTE.divider, padding: 10,
 },
 modalTitle: { fontWeight: "800", color: PALETTE.text, marginBottom: 6 },
 modalOption: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
 modalOptionActive: { backgroundColor: PALETTE.chipBg },
 modalOptionText: { color: PALETTE.text, fontWeight: "600" },
 modalOptionTextActive: { color: PALETTE.accentDark },


 // FILTER SHEET
 sheetBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.35)" },


 // anchored to bottom, safe-area aware, not taller than 85% of screen
 sheet: {
   position: "absolute", left: 0, right: 0, bottom: 0,
   maxHeight: "85%",
   backgroundColor: PALETTE.card,
   borderTopLeftRadius: 16, borderTopRightRadius: 16,
 },
 grabber: { alignSelf: "center", width: 56, height: 5, borderRadius: 3, backgroundColor: "#D8D8D8", marginTop: 8 },


 sheetKEV: {
   // fills the screen for proper keyboard avoidance
   flex: 1,
   justifyContent: "flex-end",
 },
  // NEW: wraps scrollable body + sticky footer
 sheetContent: {
   maxHeight: "100%",
   flexDirection: "column",
 },


 // Body flexes; footer has its own reserved space
 sheetBody: { maxHeight: "85%", flex: 1, paddingHorizontal: 16, paddingTop: 8 },


 sheetFooter: {
   borderTopWidth: 1, borderColor: PALETTE.divider,
   paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18,
   flexDirection: "row", justifyContent: "space-between", alignItems: "center",
 },
 clearAll: { color: "#346A6F", fontWeight: "700" },
 applyBtn: {
   backgroundColor: PALETTE.accent,
   paddingVertical: 14, paddingHorizontal: 28,
   borderRadius: 28, alignItems: "center", justifyContent: "center",
 },
 applyText: { color: "#fff", fontWeight: "700", fontSize: 16 },


 sheetHeading: { fontWeight: "800", color: PALETTE.text, marginTop: 8, marginBottom: 6 },
 sortTabs: { flexDirection: "row", backgroundColor: PALETTE.faint, borderRadius: 12, padding: 4, gap: 4, marginBottom: 8 },
 sortTab: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10 },
 sortTabActive: { backgroundColor: PALETTE.card, borderWidth: 1, borderColor: PALETTE.divider },
 sortTabText: { color: PALETTE.subtext, fontWeight: "700" },
 sortTabTextActive: { color: PALETTE.ink },


 chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
 filterChip: {
   backgroundColor: PALETTE.chipBg, borderColor: PALETTE.divider, borderWidth: 1,
   paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
 },
 filterChipText: { color: PALETTE.text, fontWeight: "600" },


 section: { borderTopWidth: 1, borderColor: PALETTE.divider, paddingTop: 10, marginTop: 8 },
 sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
 sectionTitle: { fontWeight: "800", color: PALETTE.text, fontSize: 16 },
 clearInline: { fontSize: 18, color: "#6B5E4A", fontWeight: "700" },


 searchBox: {
   flexDirection: "row", alignItems: "center",
   backgroundColor: "#F2F2F2", borderRadius: 10,
   paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
 },
 searchIcon: { marginRight: 6 },
 searchInput: { flex: 1, color: PALETTE.text },


 cityRow: {
   flexDirection: "row", alignItems: "center", justifyContent: "space-between",
   paddingVertical: 14, borderBottomWidth: 1, borderColor: "#EFECE6",
 },
 cityLead: { color: PALETTE.ink, fontWeight: "700" },
 cityName: { color: PALETTE.text },


 checkbox: {
   width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#A9B2A9",
   alignItems: "center", justifyContent: "center",
 },
 checkboxChecked: { backgroundColor: PALETTE.accent, borderColor: PALETTE.accent },


 pill: {
   backgroundColor: PALETTE.chipBg, borderColor: PALETTE.divider, borderWidth: 1,
   paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
 },
 pillActive: { backgroundColor: "#E3EFE6", borderColor: "#CFE1D3" },
 pillText: { color: PALETTE.text, fontWeight: "600" },
 pillTextActive: { color: PALETTE.accentDark, fontWeight: "800" },


 hikeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8, marginBottom: 8 },
 hikeLabel: { color: PALETTE.text, fontWeight: "700", width: 110 },


 emptyWrap: { padding: 20, alignItems: "center" },
 emptyText: { color: PALETTE.subtext, fontStyle: "italic" },
});



