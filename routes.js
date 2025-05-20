// routes.js
const NEW_ROUTE_THRESHOLD_DAYS = 14;

const colorNameToHex = (colorName) => {
    const name = colorName ? String(colorName).toLowerCase().replace(/\s+/g, '') : 'unknown';
    const map = {
        orange: "#FFA500", blue: "#007BFF", neongreen: "#39FF14", limegreen: "#32CD32",
        purple: "#800080", green: "#28A745", yellow: "#FFD700", red: "#DC3545",
        grey: "#6C757D", gray: "#6C757D", pink: "#E83E8C", black: "#343a40",
        white: "#f8f9fa", teal: "#20c997", cyan: "#17a2b8", brown: "#a0522d",
        unknown: '#CCCCCC'
    };
    return map[name] || map['unknown'];
};

const allRoutes = [
    { id: 1, wall: "The Arch", grade: "5.10d", color: "Blue", setDate: "2024-05-15", type: "top-rope", description: "Sustained overhang.", isChallenge: true },
    { id: 2, wall: "Slab Heaven", grade: "5.7", color: "Yellow", setDate: "2024-05-12", type: "top-rope", description: "Balance and footwork.", isChallenge: false },
    { id: 3, wall: "Boulder Cave Left", grade: "V4", color: "Red", setDate: "2024-05-10", type: "boulder", description: "Powerful moves.", isChallenge: true },
    { id: 4, wall: "The Arch", grade: "V2", color: "Green", setDate: "2024-05-09", type: "boulder", description: "Fun intro to cave.", isChallenge: false },
    { id: 5, wall: "Training Board", grade: "V6", color: "White", setDate: "2024-05-16", type: "boulder", description: "System problem.", isChallenge: true },
    { id: 6, wall: "Slab Heaven", grade: "5.11b", color: "Pink", setDate: "2024-05-01", type: "top-rope", description: "Techy slab moves.", isChallenge: false },
    { id: 7, wall: "Kid's Wall", grade: "5.5", color: "Rainbow", setDate: "2024-05-17", type: "top-rope", description: "Fun for all ages", isChallenge: false },
    { id: 8, wall: "Boulder Cave Right", grade: "V0", color: "Orange", setDate: "2024-05-18", type: "boulder", description: "Juggy warm-up", isChallenge: false },
    { id: 9, wall: "Main Lead Wall", grade: "5.12a", color: "Purple", setDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], type: "top-rope", description: "Test piece!", isChallenge: true },
    { id: 10, wall: "Short Overhang", grade: "V3+", color: "Teal", setDate: "2024-04-30", type: "boulder", description: "Compression crux", isChallenge: false },
    // Add more diverse routes here
];

allRoutes.forEach(route => {
    route.colorHex = colorNameToHex(route.color);
});