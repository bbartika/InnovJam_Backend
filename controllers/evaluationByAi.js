const axios = require("axios");

// const data = [
//     {
//         suggested_answer: [
//             'Goal Setting LuxeFashions sets SMART goals that support their broader marketing and business objectives, such as:',
//             'Increase online sales revenue by 25% within the next fiscal year through affiliate marketing channels, in line with their aim to expand market share.',
//             'Grow online traffic from affiliate referrals by 40%, contributing to their objective of increasing online traffic overall.',
//             'Affiliate Selection and Relationship Building LuxeFashions identifies and recruits affiliates whose audiences align with their target market segments, such as high-income professionals and fashion influencers. They focus on building strong relationships with affiliates who have proven reach, credibility, content quality, and high audience engagement to attract both local shoppers and international tourists interested in luxury experiences.',
//             'Commission Structure and Incentives The company designs a commission structure to motivate affiliates, incorporating various commission types such as pay-per-sale for exclusive in-house labels or pay-per-lead for new customer acquisitions. They establish tiered commission levels based on performance to incentivize higher sales volumes, directly supporting their revenue growth goal.',
//             'Integration with Marketing Mix LuxeFashions ensures that affiliate marketing activities are seamlessly integrated with other elements of the marketing mix, promoting consistency across product promotions, pricing strategies, and distribution channels. Affiliate marketing initiatives are scheduled in tandem with store promotions and e-commerce platform campaigns to reinforce the overall marketing message.',
//             'Monitoring and Optimization The company implements tracking and reporting mechanisms to monitor affiliate program performance, allowing for continuous optimization based on the set goals. LuxeFashions uses this data to adjust commission structures as needed, provide affiliates with additional resources or incentives, and refine affiliate selection criteria to boost conversions and sales.',
//             "Training and Support LuxeFashions equips affiliates with the necessary tools, resources, and training to market their products effectively, focusing on high-quality, sustainable fashion. This support includes marketing collateral, detailed product information, and sales tips, aligning with LuxeFashions' commitment to superior customer service and sustainability."
//         ],
//         student_answer: 'LuxeFashions can develop an effective affiliate marketing strategy implementation plan by first setting clear goals, such as increasing website traffic, boosting sales, or enhancing brand visibility. They should then identify their target audience, ensuring that affiliates reach the right demographic and align with the brand’s values. Next, LuxeFashions can select suitable affiliates, such as influencers or publishers, who resonate with their brand. Afterward, the company should design attractive affiliate offers, including competitive commission structures or exclusive discounts. Finally, LuxeFashions should track affiliate performance and optimize the strategy continuously based on insights to drive long-term success.\n' +
//             '\n'
//     },
// ]
const evaluationByAI = async (studentdata, llm_name) => {
    try {
        console.log(`Attempt : Sending request to AI API...`);
        const response = await axios.post(
            `${process.env.AI_SERVER_URL}/evaluate/${llm_name}`, studentdata,
        );
        const { results } = response.data;
        return results;
    } catch (error) {
        console.error(`❌ Attempt failed:`, error.message || error);
    }
};
module.exports = evaluationByAI