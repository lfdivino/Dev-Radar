const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');

const { findConnections, sendMessage } = require('../websocket');

module.exports = {
    async index(request, response){
        const devs = await Dev.find();

        return response.json(devs);
    },

    async store(request, response) {
        const { github_username, techs, latitude, longitude } = request.body;

        let dev = await Dev.findOne({ github_username });

        if (!dev){
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
        
            const { name = login, avatar_url, bio } = apiResponse.data;
        
            const techsArray = parseStringAsArray(techs);
        
            const location = {
                type: 'Point',
                coordinates: [longitude, latitude],
            }
        
            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location,
            });
            
            const sendSocketMessageTo = findConnections(
                { latitude, longitude },
                techsArray,
            )

            sendMessage(sendSocketMessageTo, 'new-dev', dev);
        };
        
        return response.json(dev);
    },

    async update(request, response){

        const { github_username } = request.params;

        const { name, bio, avatar_url, techs, latitude, longitude } = request.body;
        
        let dev = await Dev.findOne({ github_username });

        if (dev) {
            let updateValues = {};

            if (name) {
                updateValues['name'] = name;
            };
            if (bio) {
                updateValues['bio'] = bio;
            };
            if (avatar_url) {
                updateValues['techs'] = parseStringAsArray(techs);
            };
            if (latitude && longitude) {
                const location = {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                };
            };

            dev = await Dev.updateOne({github_username}, updateValues);

        };

        return response.json({ dev });
    },

    async destroy(request, response){
        
        const { github_username } = request.params;

        let dev = await Dev.deleteOne({ github_username });

        return response.json({ dev });
    },
};
