// Business Analysis Module for Mind Castle

const businessAnalysis = (() => {
    // DOM Elements
    let modal;
    let closeBtn;
    let downloadBtn;
    let shareBtn;
    let loadingContainer;
    let analysisContent;
    let closeButtons;
    
    // Statistics and data storage
    let analysisData = {
        totalRooms: 0,
        totalVisits: 0,
        averageTimeSpent: 0,
        popularRooms: [],
        growthRate: 0,
        returningUsers: 0,
        recommendations: []
    };
    
    // Initialize the module
    function init() {
        // Get DOM elements
        modal = document.querySelector('.analysis-modal');
        closeBtn = document.querySelector('.analysis-modal .close');
        downloadBtn = document.getElementById('download-report');
        shareBtn = document.getElementById('share-insights');
        loadingContainer = document.querySelector('.loading-container');
        analysisContent = document.querySelector('.analysis-modal-body');
        closeButtons = document.querySelectorAll('.analysis-modal .close-btn, .analysis-modal .close');
        
        // Set up event listeners
        if (closeButtons && closeButtons.length) {
            closeButtons.forEach(btn => {
                btn.addEventListener('click', closeModal);
            });
        }
        
        // Close modal when clicking outside of modal content
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // Button event listeners
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadReport);
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', shareInsights);
        }
        
        // Connect to premium feature button
        setupPremiumFeatureButton();
    }
    
    // Connect the premium feature button to this module
    function setupPremiumFeatureButton() {
        const premiumBtn = document.getElementById('premiumFeatureButton');
        
        if (premiumBtn) {
            premiumBtn.addEventListener('click', function() {
                // Get current thought ID from the modal
                const thoughtModal = document.getElementById('thoughtModal');
                const thoughtId = thoughtModal ? thoughtModal.getAttribute('data-thought-id') : null;
                
                // Open the analysis modal with the thought ID
                openModal(thoughtId);
            });
        }
    }
    
    // Open the analysis modal and start analysis
    function openModal(thoughtId) {
        if (!modal) return;
        
        // Show modal
        modal.style.display = 'block';
        
        // Show loading state
        showLoading();
        
        // Fetch analysis data
        fetchAnalysisData(thoughtId);
        
        // Prevent page scrolling when modal is open
        document.body.style.overflow = 'hidden';
    }
    
    // Close the analysis modal
    function closeModal() {
        if (!modal) return;
        
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Show loading spinner
    function showLoading() {
        if (!loadingContainer || !analysisContent) return;
        
        loadingContainer.classList.remove('hidden');
        analysisContent.innerHTML = '';
    }
    
    // Hide loading spinner
    function hideLoading() {
        if (!loadingContainer) return;
        
        loadingContainer.classList.add('hidden');
    }
    
    // Fetch analysis data
    function fetchAnalysisData(thoughtId) {
        // Simulate API call with setTimeout
        setTimeout(() => {
            // Sample data - in a real app, this would come from an API
            const analysisData = {
                businessName: "Eco Friendly Packaging Solutions",
                viabilityScore: 78,
                marketPotential: 85,
                competitorCount: 12,
                estimatedCost: "$50K - $100K",
                recommendations: [
                    "Focus on sustainable materials that are cost-effective",
                    "Consider partnerships with local eco-conscious businesses",
                    "Develop a strong brand identity focused on environmental impact"
                ],
                swotAnalysis: {
                    strengths: [
                        "Growing market demand for sustainable products",
                        "Lower long-term costs for consumers",
                        "Positive environmental impact"
                    ],
                    weaknesses: [
                        "Higher initial production costs",
                        "Limited awareness in certain markets",
                        "Supply chain complexity"
                    ],
                    opportunities: [
                        "Expanding regulatory pressure on plastic packaging",
                        "Growing consumer willingness to pay premium for sustainability",
                        "Potential for government incentives and subsidies"
                    ],
                    threats: [
                        "Established competitors with deep pockets",
                        "Price sensitivity in mass markets",
                        "Rapidly changing technology in materials science"
                    ]
                }
            };
            
            // Render the analysis data
            renderAnalysisData(analysisData);
            
            // Hide loading
            hideLoading();
        }, 1800); // Simulate network delay
    }
    
    // Render the analysis content
    function renderAnalysisData(data) {
        if (!analysisContent) return;
        
        const html = `
            <div class="stats-container">
                <div class="stat-card">
                    <h3>Viability Score</h3>
                    <div class="stat-value">${data.viabilityScore}/100</div>
                    <div class="stat-description">Overall business viability</div>
                </div>
                <div class="stat-card">
                    <h3>Market Potential</h3>
                    <div class="stat-value">${data.marketPotential}/100</div>
                    <div class="stat-description">Growth opportunity assessment</div>
                </div>
                <div class="stat-card">
                    <h3>Competitor Analysis</h3>
                    <div class="stat-value">${data.competitorCount}</div>
                    <div class="stat-description">Significant competitors identified</div>
                </div>
                <div class="stat-card">
                    <h3>Estimated Startup Cost</h3>
                    <div class="stat-value">${data.estimatedCost}</div>
                    <div class="stat-description">Initial investment required</div>
                </div>
            </div>
            
            <div class="stats-detail">
                <h3>SWOT Analysis</h3>
                <div class="swot-container">
                    <div class="swot-section">
                        <h4>Strengths</h4>
                        <ul>
                            ${data.swotAnalysis.strengths.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="swot-section">
                        <h4>Weaknesses</h4>
                        <ul>
                            ${data.swotAnalysis.weaknesses.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="swot-section">
                        <h4>Opportunities</h4>
                        <ul>
                            ${data.swotAnalysis.opportunities.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="swot-section">
                        <h4>Threats</h4>
                        <ul>
                            ${data.swotAnalysis.threats.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="recommendations">
                <h3>Recommendations</h3>
                <ul>
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        
        analysisContent.innerHTML = html;
    }
    
    // Download the report as PDF (placeholder function)
    function downloadReport() {
        alert('Downloading business analysis report...');
        // In a real application, this would generate and download a PDF or CSV
    }
    
    // Share insights via email or social media (placeholder function)
    function shareInsights() {
        alert('Sharing business insights...');
        // In a real application, this would open a share dialog
    }
    
    // Public API
    return {
        init,
        openModal,
        closeModal
    };
})();

// Initialize the business analysis module when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    businessAnalysis.init();
    
    // For testing: Add a button to open the analysis modal
    const testButton = document.createElement('button');
    testButton.textContent = 'Open Business Analysis';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '999';
    testButton.classList.add('btn', 'btn-primary');
    testButton.addEventListener('click', () => businessAnalysis.openModal());
    document.body.appendChild(testButton);
}); 