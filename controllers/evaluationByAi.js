const axios = require("axios");

const evaluationByAI = async (studentdata, llm_name) => {

    console.log(llm_name);

    try {
        console.log(" WORKING ON AI REQUEST");
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