export interface WorkItem {
  url: string
  title: string
  solution: string
  tags: string[]
  image: string
}

const u = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`

export const workItems: WorkItem[] = [
  { url: "https://localfoodie.io/", title: "Local Foodie", solution: "Discover the best places to eat in San Luis Obispo, California", tags: ["AI", "React", "Vite", "Regional"], image: u('photo-1511690656952-34342bb7c2f2') },
  { url: "https://isaiah.app.link/", title: "Ask Isaiah", solution: "Faith-based AI assistant for connection, scripture and guidance", tags: ["AI", "React Native", "Expo", "Chatbot"], image: u('photo-1450558415837-1f5e21a17709') },
  { url: "https://www.fws.gov/", title: "U.S. Fish & Wildlife Service", solution: "Species management and tracking applications", tags: ["Drupal", "Government"], image: u('photo-1611689342806-0863700ce1e4') },
  { url: "https://www.bubbas33.com/", title: "Bubba's 33", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1466978913421-dad2ebd01d17') },
  { url: "https://www.noodles.com/", title: "Noodles & Company", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1623341214825-9f4f963727da') },
  { url: "https://www.redrobin.com/", title: "Red Robin", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1572802419224-296b0aeee0d9') },
  { url: "https://www.dennys.com/", title: "Denny's", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1596728399355-5fefc4f5697a') },
  { url: "https://www.bcbsks.com/", title: "Blue Cross Blue Shield", solution: "Front End Architecture", tags: ["Drupal", "Healthcare"], image: u('photo-1666214277657-e60f05c40b04') },
  { url: "https://www.thecheesecakefactory.com/", title: "Cheesecake Factory", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1578775887804-699de7086ff9') },
  { url: "https://www.ny.gov/", title: "New York State Government", solution: "Local Development Architecture", tags: ["Drupal", "Government"], image: u('photo-1543716091-a840c05249ec') },
  { url: "https://pandaexpress.com/", title: "Panda Express", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1623689046286-01d812cc8bad') },
  { url: "https://www.dutchbros.com/", title: "Dutch Bros", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1623400518626-6ea9ab64c5ec') },
  { url: "https://www.freddys.com/", title: "Freddy's", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1561758033-d89a9ad46330') },
  { url: "https://www.texasroadhouse.com/", title: "Texas Roadhouse", solution: "Order Ahead Marketing Application", tags: ["Drupal", "QSR"], image: u('photo-1615937722923-67f6deaf2cc9') },
  { url: "https://www.ccsoccer.com/", title: "CCSoccer", solution: "Regional Soccer League Management System", tags: ["Drupal", "Commerce", "Regional"], image: u('photo-1431324155629-1a6deb1dec8d') },
  { url: "https://www.transunion.com/", title: "TransUnion", solution: "Credit Bureau Data Services", tags: ["React", "TeamSite", "Government"], image: u('photo-1520333789090-1afc82db536a') },
  { url: "https://www.trueidentity.com/", title: "True Identity", solution: "Identity Protection Application", tags: ["TeamSite", "Government"], image: u('photo-1633265486064-086b219458ec') },
  { url: "https://www.navyfederal.org/", title: "Navy Federal", solution: "Federal Personal Credit Lender", tags: ["TeamSite", "Government"], image: u('photo-1494476105528-620b211f568d') },
  { url: "https://www.aegworldwide.com/", title: "AEG Worldwide", solution: "Global Marketing Platform", tags: ["Drupal", "Entertainment"], image: u('photo-1533174072545-7a4b6ad7a6c3') },
  { url: "https://www.bookitprogram.com/", title: "Pizza Hut", solution: "BOOK IT! Program Administration Application", tags: ["Drupal", "Education"], image: u('photo-1513104890138-7c749659a591') },
  { url: "https://www.wingstop.com/order/", title: "Wingstop", solution: "Order Ahead Application", tags: ["Angular", "QSR"], image: u('photo-1567620832903-9fc6debc209f') },
  { url: "https://order.portillos.com/", title: "Portillo's", solution: "Order Ahead Application", tags: ["React", "QSR"], image: u('photo-1733507100601-323ca84d7277') },
  { url: "https://petsmartcharities.org/", title: "PetSmart", solution: "Charity and Marketing Application", tags: ["Drupal", "Charity"], image: u('photo-1450778869180-41d0601e046e') },
  { url: "https://www.lorealtechincubator.com/colorandco", title: "L'Oreal", solution: "Real-time Beauty Salon Consultation Application", tags: ["React", "Healthcare"], image: u('photo-1555820585-c5ae44394b79') },
  { url: "https://wearehathway.com/", title: "Hathway", solution: "Agency Marketing Platform", tags: ["React", "Agency"], image: u('photo-1568992687947-868a62a9f521') },
  { url: "https://www.kroger.com/", title: "Kroger", solution: "In-store Kiosk Order Application", tags: ["Backbone", "QSR"], image: u('photo-1601600576337-c1d8a0d1373c') },
  { url: "https://www.dairyqueen.com/en-us/app/", title: "Dairy Queen", solution: "Microsite and Email Campaigns", tags: ["Custom Framework", "QSR"], image: u('photo-1586985288206-3cdc4f67cd03') },
  { url: "https://www.foryourparty.com/", title: "ForYourParty", solution: "Product Designer and Commerce Applications", tags: ["React", "Drupal", "Commerce"], image: u('photo-1699730164892-d7c433524ff3') },
  { url: "https://www.amway.com/", title: "Amway", solution: "Internal Documentation Platform", tags: ["Drupal", "Internal"], image: u('photo-1572021335469-31706a17aaef') },
  { url: "https://coffeebean.com/", title: "Coffee Bean and Tea Leaf", solution: "Order Ahead Application, Microsite and Email Campaigns", tags: ["Drupal", "Custom Framework", "QSR"], image: u('photo-1509042239860-f550ce710b93') },
  { url: "https://www.redbull.com/us-en/", title: "Red Bull", solution: "Year in Review Campaign", tags: ["Drupal", "Entertainment"], image: u('photo-1613218222876-954978a4404e') },
  { url: "https://www.brightview.com/", title: "BrightView", solution: "Marketing Application", tags: ["Drupal", "Landscaping"], image: u('photo-1597201278257-3687be27d954') },
  { url: "https://www.stubhub.com/", title: "StubHub", solution: "Internal Email Management System", tags: ["Drupal", "Internal"], image: u('photo-1678227547309-f25998d4fc86') },
  { url: "https://community.tibco.com/", title: "Tibco", solution: "Community Forum and Marketing Applications", tags: ["Drupal", "Community"], image: u('photo-1569292567777-e5d61a759322') },
  { url: "https://code.cerner.com/", title: "Cerner", solution: "Marketing and Developer Portal Application", tags: ["Drupal", "Community"], image: u('photo-1753715613382-dc3e8456dbc9') },
  { url: "https://www.a10networks.com/", title: "A10 Networks", solution: "Marketing and Documentation Application", tags: ["Drupal", "Data Hardware"], image: u('photo-1580106815433-a5b1d1d53d85') },
  { url: "https://www.lumentum.com/", title: "Lumentum", solution: "Marketing and Documentation Application", tags: ["Drupal", "Data Hardware"], image: u('photo-1558494949-ef010cbdcc31') },
  { url: "https://www.transamerica.com/", title: "TransAmerica", solution: "Social Media Trickshot Campaign", tags: ["Drupal", "Entertainment"], image: u('photo-1632244112951-95b29c92eee1') },
  { url: "https://accuair.com/", title: "AccuAir Suspension", solution: "Marketing and Commerce Application", tags: ["Drupal", "Commerce"], image: u('photo-1760317890283-540a468b86f6') },
]
