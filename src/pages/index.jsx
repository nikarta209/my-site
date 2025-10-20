import Layout from "./Layout.jsx";

import Home from "./Home";

import Catalog from "./Catalog";

import UserHome from "./UserHome";

import BookDetails from "./BookDetails";

import Profile from "./Profile";

import Cart from "./Cart";

import Library from "./Library";

import Reader from "./Reader";

import RegisterAuthor from "./RegisterAuthor";

import Analytics from "./Analytics";

import UserAnalytics from "./UserAnalytics";

import UserDashboard from "./UserDashboard";

import AdminDashboard from "./AdminDashboard";

import TestSuite from "./TestSuite";

import DeployGuide from "./DeployGuide";

import Search from "./Search";

import ResaleMarket from "./ResaleMarket";

import BookQuiz from "./BookQuiz";

import BackendSetupGuide from "./BackendSetupGuide";

import DataModels from "./DataModels";

import BackendControllersGuide from "./BackendControllersGuide";

import BackendInfrastructureGuide from "./BackendInfrastructureGuide";

import AuthorPanel from "./AuthorPanel";

import ModerationPage from "./ModerationPage";

import BookModerationDetails from "./BookModerationDetails";

import PlatformCapabilities from "./PlatformCapabilities";

import NoteFeed from "./NoteFeed";

import NotesFeed from "./NotesFeed";

import AuthorPanelRedesign from "./AuthorPanelRedesign";

import AIRecommendations from "./AIRecommendations";

import MyNotes from "./MyNotes.jsx";

import Novelties from "./Novelties";

import ReferralDashboard from "./ReferralDashboard";

import SubscriptionManagement from "./SubscriptionManagement";

import SubscriptionPage from "./SubscriptionPage";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Catalog: Catalog,
    
    UserHome: UserHome,
    
    BookDetails: BookDetails,
    
    Profile: Profile,
    
    Cart: Cart,
    
    Library: Library,
    
    Reader: Reader,
    
    RegisterAuthor: RegisterAuthor,
    
    Analytics: Analytics,
    
    UserAnalytics: UserAnalytics,
    
    UserDashboard: UserDashboard,
    
    AdminDashboard: AdminDashboard,
    
    TestSuite: TestSuite,
    
    DeployGuide: DeployGuide,
    
    Search: Search,
    
    ResaleMarket: ResaleMarket,
    
    BookQuiz: BookQuiz,
    
    BackendSetupGuide: BackendSetupGuide,
    
    DataModels: DataModels,
    
    BackendControllersGuide: BackendControllersGuide,
    
    BackendInfrastructureGuide: BackendInfrastructureGuide,
    
    AuthorPanel: AuthorPanel,
    
    ModerationPage: ModerationPage,
    
    BookModerationDetails: BookModerationDetails,
    
    PlatformCapabilities: PlatformCapabilities,
    
    NoteFeed: NoteFeed,
    
    NotesFeed: NotesFeed,
    Notes: MyNotes,
    
    AuthorPanelRedesign: AuthorPanelRedesign,
    
    AIRecommendations: AIRecommendations,
    
    Novelties: Novelties,
    
    ReferralDashboard: ReferralDashboard,
    
    SubscriptionManagement: SubscriptionManagement,
    
    SubscriptionPage: SubscriptionPage,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Catalog" element={<Catalog />} />
                
                <Route path="/UserHome" element={<UserHome />} />
                
                <Route path="/books/:id" element={<BookDetails />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/Library" element={<Library />} />
                <Route path="/library/notes" element={<MyNotes />} />
                
                <Route path="/Reader" element={<Reader />} />
                
                <Route path="/RegisterAuthor" element={<RegisterAuthor />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/UserAnalytics" element={<UserAnalytics />} />
                
                <Route path="/UserDashboard" element={<UserDashboard />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/TestSuite" element={<TestSuite />} />
                
                <Route path="/DeployGuide" element={<DeployGuide />} />
                
                <Route path="/Search" element={<Search />} />
                
                <Route path="/ResaleMarket" element={<ResaleMarket />} />
                
                <Route path="/BookQuiz" element={<BookQuiz />} />
                
                <Route path="/BackendSetupGuide" element={<BackendSetupGuide />} />
                
                <Route path="/DataModels" element={<DataModels />} />
                
                <Route path="/BackendControllersGuide" element={<BackendControllersGuide />} />
                
                <Route path="/BackendInfrastructureGuide" element={<BackendInfrastructureGuide />} />
                
                <Route path="/AuthorPanel" element={<AuthorPanel />} />
                
                <Route path="/ModerationPage" element={<ModerationPage />} />
                
                <Route path="/BookModerationDetails" element={<BookModerationDetails />} />
                
                <Route path="/PlatformCapabilities" element={<PlatformCapabilities />} />
                
                <Route path="/NoteFeed" element={<NoteFeed />} />
                
                <Route path="/NotesFeed" element={<NotesFeed />} />
                <Route path="/Notes" element={<Navigate to="/library/notes" replace />} />
                <Route path="/notes" element={<Navigate to="/library/notes" replace />} />
                
                <Route path="/AuthorPanelRedesign" element={<AuthorPanelRedesign />} />
                
                <Route path="/AIRecommendations" element={<AIRecommendations />} />
                
                <Route path="/Novelties" element={<Novelties />} />
                
                <Route path="/ReferralDashboard" element={<ReferralDashboard />} />
                
                <Route path="/SubscriptionManagement" element={<SubscriptionManagement />} />
                
                <Route path="/SubscriptionPage" element={<SubscriptionPage />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}