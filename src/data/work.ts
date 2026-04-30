export interface WorkItem {
  url: string
  title: string
  solution: string
  tags: string[]
  image: string
}

const u = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`

export const workItems: WorkItem[] = [
  { url: "https://localfoodie.io/", title: "Local Foodie", solution: "Discover the best places to eat in San Luis Obispo, California", tags: ["AI", "React", "Vite", "Regional"], image: u('photo-1645292821217-fb77e7fa7269') },
  { url: "https://isaiah.app.link/", title: "Ask Isaiah", solution: "Faith-based AI assistant for connection, scripture and guidence", tags: ["AI", "React Native", "Expo", "Chatbot"], image: u('photo-1450558415837-1f5e21a17709') },
  { url: "https://www.fws.gov/", title: "U.S. Fish & Wildlife Service", solution: "Species management and tracking applications", tags: ["Drupal", "Government"], image: u('photo-1631820018357-7527ff384843') },
  { url: "https://www.bubbas33.com/", title: "Bubba's 33", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1706650616334-97875fae8521') },
  { url: "https://www.noodles.com/", title: "Noodles & Company", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1617212287762-93de692f8c8b') },
  { url: "https://www.redrobin.com/", title: "Red Robin", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1568901346375-23c9450c58cd') },
  { url: "https://www.dennys.com/", title: "Denny's", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1637533114107-1dc725c6e576') },
  { url: "https://www.bcbsks.com/", title: "Blue Cross Blue Shield", solution: "Front End Architecture", tags: ["Drupal", "Healthcare"], image: u('photo-1512678080530-7760d81faba6') },
  { url: "https://www.thecheesecakefactory.com/", title: "Cheesecake Factory", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1609577737938-fb2139fa4c78') },
  { url: "https://www.ny.gov/", title: "New York State Government", solution: "Local Development Architecture", tags: ["Drupal", "Government"], image: u('photo-1570304816841-906a17d7b067') },
  { url: "https://pandaexpress.com/", title: "Panda Express", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1701480253822-1842236c9a97') },
  { url: "https://www.dutchbros.com/", title: "Dutch Bros", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1497515114629-f71d768fd07c') },
  { url: "https://www.freddys.com/", title: "Freddy's", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1586190848861-99aa4a171e90') },
  { url: "https://www.texasroadhouse.com/", title: "Texas Roadhouse", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1615937722923-67f6deaf2cc9') },
  { url: "https://www.ccsoccer.com/", title: "CCSoccer", solution: "Regional Soccer League Management System", tags: ["Drupal", "Commerce", "Regional"], image: u('photo-1522778119026-d647f0596c20') },
  { url: "https://www.transunion.com/", title: "TransUnion", solution: "Credit Bureau Data Services", tags: ["React", "TeamSite", "Government"], image: u('photo-1556742031-c6961e8560b0') },
  { url: "https://www.trueidentity.com/", title: "True Identity", solution: "Identity Protection Application", tags: ["TeamSite", "Government"], image: u('photo-1563013544-824ae1b704d3') },
  { url: "https://www.navyfederal.org/", title: "Navy Federal", solution: "Federal Personal Credit Lender", tags: ["TeamSite", "Government"], image: u('photo-1494476105528-620b211f568d') },
  { url: "https://www.aegworldwide.com/", title: "AEG Worldwide", solution: "Global Marketing Platform", tags: ["Drupal", "Entertainment"], image: u('photo-1576514129883-2f1d47a65da6') },
  { url: "https://www.bookitprogram.com/", title: "Pizza Hut", solution: "BOOK IT! Program Administration Application", tags: ["Drupal", "Education"], image: u('photo-1513104890138-7c749659a591') },
  { url: "https://www.wingstop.com/order/", title: "Wingstop", solution: "Order Ahead Application", tags: ["Angular", "QSR"], image: u('photo-1567620832903-9fc6debc209f') },
  { url: "https://order.portillos.com/", title: "Portillo's", solution: "Order Ahead Application", tags: ["React", "QSR"], image: u('photo-1572802419224-296b0aeee0d9') },
  { url: "https://petsmartcharities.org/", title: "PetSmart", solution: "Charity and Marketing Application", tags: ["Drupal", "Charity"], image: u('photo-1765603950481-3a5879ec2ce7') },
  { url: "https://www.lorealtechincubator.com/colorandco", title: "L'Oreal", solution: "Real-time Beauty Salon Consultation Application", tags: ["React", "Healthcare"], image: u('photo-1667369039699-f30c4b863e51') },
  { url: "https://wearehathway.com/", title: "Hathway", solution: "Agency Marketing Platform", tags: ["React", "Agency"], image: u('photo-1568992687947-868a62a9f521') },
  { url: "https://www.kroger.com/", title: "Kroger", solution: "In-store Kiosk Order Application", tags: ["Backbone", "QSR"], image: u('photo-1604719312566-8912e9227c6a') },
  { url: "https://www.dairyqueen.com/en-us/app/", title: "Dairy Queen", solution: "Microsite and Email Campaigns", tags: ["Custom Framework", "QSR"], image: u('photo-1497034825429-c343d7c6a68f') },
  { url: "https://www.foryourparty.com/", title: "ForYourParty", solution: "Product Designer and Commerce Applications", tags: ["React", "Drupal", "Commerce"], image: u('photo-1721308303481-1b72cdd51912') },
  { url: "https://www.amway.com/", title: "Amway", solution: "Internal Documentation Platform", tags: ["Drupal", "Internal"], image: u('photo-1572021335469-31706a17aaef') },
  { url: "https://coffeebean.com/", title: "Coffee Bean and Tea Leaf", solution: "Order Ahead Application, Microsite and Email Campaigns", tags: ["Drupal", "Custom Framework", "QSR"], image: u('photo-1533776992670-a72f4c28235e') },
  { url: "https://www.redbull.com/us-en/", title: "Red Bull", solution: "Year in Review Campaign", tags: ["Drupal", "Entertainment"], image: u('photo-1679002046293-cb63ff0022e9') },
  { url: "https://www.brightview.com/", title: "BrightView", solution: "Marketing Application", tags: ["Drupal", "Landscaping"], image: u('photo-1734079692160-fcbe4be6ab96') },
  { url: "https://www.stubhub.com/", title: "StubHub", solution: "Internal Email Management System", tags: ["Drupal", "Internal"], image: u('photo-1678227547327-ec5745559b29') },
  { url: "https://community.tibco.com/", title: "Tibco", solution: "Community Forum and Marketing Applications", tags: ["Drupal", "Community"], image: u('photo-1569292567777-e5d61a759322') },
  { url: "https://code.cerner.com/", title: "Cerner", solution: "Marketing and Developer Portal Application", tags: ["Drupal", "Community"], image: u('photo-1601689892697-b64daa00ff6d') },
  { url: "https://www.a10networks.com/", title: "A10 Networks", solution: "Marketing and Documentation Application", tags: ["Drupal", "Data Hardware"], image: u('photo-1580106815433-a5b1d1d53d85') },
  { url: "https://www.lumentum.com/", title: "Lumentum", solution: "Marketing and Documentation Application", tags: ["Drupal", "Data Hardware"], image: u('photo-1624965439943-09e0238644e2') },
  { url: "https://www.transamerica.com/", title: "TransAmerica", solution: "Social Media Trickshot Campaign", tags: ["Drupal", "Entertainment"], image: u('photo-1521747116042-5a810fda9664') },
  { url: "https://accuair.com/", title: "AccuAir Suspension", solution: "Marketing and Commerce Application", tags: ["Drupal", "Commerce"], image: u('photo-1640021042525-5610f9f75444') },
]
