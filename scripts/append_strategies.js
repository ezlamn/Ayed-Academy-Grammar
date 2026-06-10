const fs = require('fs');

const rawData = [
  {
    "strategy": "Third Strategy: Referring Technique",
    "passages": [
      {
        "title": "PASSAGE 1",
        "text": "3) In 1968, both countries formed a joint committee. They formed it to assess the financial undertaking required for the task. As a result, the World Bank was requested by the committee to contribute their assistance in methods of implementation of the mammoth sized project. This required taking into account the environmental and geographical aspects of the Saudi-Bahrain region.",
        "questions": [
          {
            "question": "The word “it” in paragraph 3) refers to ……...",
            "options": {"a": "Saudi", "b": "Bahrain", "c": "The project", "d": "The joint committee"}
          }
        ]
      },
      {
        "title": "PASSAGE 2 (الزراعة بين الحاضر والماضي)",
        "text": "A comparison was made between cultivation in the past in 1900 and the present time. Where it was found that in the year 1900, 40% of the workers were working in the field of agriculture, and farmers were producing per day enough food for an average of 5 people, for themselves and their families, and working manually. But at the moment there is much more equipment, machinery and production.",
        "questions": [
          {
            "question": "The pronoun ‘themselves’ in paragraph (1) refers to ……",
            "options": {"a": "Agriculture", "b": "Americans", "c": "Labor force", "d": "Farmers"}
          }
        ]
      },
      {
        "title": "PASSAGE 3 (fish - السمك)",
        "text": "(2) Fish can live in almost any conditions of water. They can live in the freezing waters of Antarctica, hot jungle streams, lakes and fast flowing mountain rivers. Nearly all fish get their oxygen from water. Although we cannot see it, water does contain oxygen. To get this oxygen, the fish forces water through its gills. The gills absorb oxygen and release carbon dioxide into the water which then passes out through the gills.",
        "questions": [
          {
            "question": "The pronoun ‘it’ in Paragraph (2) refers to ……",
            "options": {"a": "fish", "b": "water", "c": "a river", "d": "oxygen"}
          }
        ]
      },
      {
        "title": "PASSAGE 4 (اديسون المخترع العظيم)",
        "text": "Thomas Edison was totally deaf in one ear and hard of hearing in the other. He thought of his deafness as a blessing in many ways. It kept conversations short, so that he could have more time for work. He called himself a “two-shift man “because he worked 16 out of every 24hours. Sometimes he worked so intensely that his wife had to remind him to sleep and eat. Thomas Edison died at the age of 84 on October 18, 1931, at his estate in West Orange, New Jersey. He left numerous inventions that improved the quality of life all over the world.",
        "questions": [
          {
            "question": "The pronoun ‘it’ in paragraph (5), refers to his......",
            "options": {"a": "Blessing.", "b": "Deafness", "c": "Thought", "d": "Ear."}
          }
        ]
      },
      {
        "title": "PASSAGE 5 Currencies",
        "text": "(6) Although the Germans and the Finns use the Euro now, their former currencies the German mark and the Finnish Markka, both have their origin in units of weight. While the Spanish peso meaning ‘weight” in Spanish, is also no longer used in Spain, it lives on as the currency of Mexico, Argentina and the Philippines. The British pound or pound sterling comes from the Latin pounds weight",
        "questions": [
          {
            "question": "The pronoun ‘it’ in paragraph (6), refers to......",
            "options": {"a": "Peso", "b": "Spain", "c": "Weight.", "d": "Markka"}
          }
        ]
      },
      {
        "title": "PASSAGE 6 (النمل)",
        "text": "(5) Ants are interesting creatures. They have very tiny bodies but live in a complex social community. They are not simply pests, as many people think; in point of fact, they represent a positive example of how planning and teamwork should work in our societies.",
        "questions": [
          {
            "question": "The pronoun ‘they’ in Paragraph (5) refers to ________.",
            "options": {"a": "Ants", "b": "pests.", "c": "bodies", "d": "people"}
          }
        ]
      },
      {
        "title": "PASSAGE 7 (Pizza)",
        "text": "Pizza, which originated in Italy. Is a fast food that is known and loved all around the world. How did it become so popular? Part of the reason is that tourists who went to Italy ate it there and loved it. When they returned to their countries, They looked for Italian restaurants that might have it. But much more significant in pizza becoming popular worldwide the fact that lots of American soldiers who were in Italy during World War II ate it there and then wanted it when they returned to the USA. This dramatic increase in the demand for pizza in the 1950s led to the development of special restaurants for pizza.",
        "questions": [
          {
            "question": "The word there in paragraph 1 refers to……………",
            "options": {"a": "the United States", "b": "a pizza restaurant", "c": "Italy", "d": "the world"}
          }
        ]
      },
      {
        "title": "PASSAGE 8",
        "text": "Scientists at an Alaskan laboratory have been busy analyzing the unknown substance. They have concluded that it is a formation of microscopic eggs. One of the scientists said that there are traces of oil in the eggs, and this is what is causing the strange, orange color.",
        "questions": [
          {
            "question": "The word it in Paragraph (2) refers to……………...",
            "options": {"a": "traces of oil", "b": "a microscope", "c": "the unknown substance", "d": "one of Alaska’s laboratories"}
          }
        ]
      }
    ]
  },
  {
    "strategy": "Fourth Strategy: Conjunctions",
    "passages": [
      {
        "title": "PASSAGE 1",
        "text": "(1) Prince Henry led the way in sponsoring exploration for Portugal, a small nation next to Spain... (4) Henry died in 1460, but the Portuguese continued their quest. In 1488. Bartholomeu Dias rounded the southern tip of Africa. Despite the turbulent seas around it, the tip became known as the Cape of Good Hope because it opened the way for a sea route to Asia.",
        "questions": [
          {
            "question": "Which word can we use to replace the word “because” in Paragraph (4)?",
            "options": {"a": "although", "b": "besides", "c": "since", "d": "so"}
          }
        ]
      },
      {
        "title": "PASSAGE 2 (Personal Finance)",
        "text": "1. An annual survey in 2017 from the National Endowment for Financial Education (NEFE) found Americans cited the most significant financial setbacks... 2. The survey also found that nearly half (48 percent) of Americans admit that they are living paycheck to paycheck. The main reasons people believe they are living paycheck to paycheck are due to credit card debt (24 percent). employment struggles (22 percent). and mortgage/ rent payments (18 percent)...",
        "questions": [
          {
            "question": "Which expression can we use to replace the expression “due to” in Paragraph (2)?",
            "options": {"a": "however", "b": "although", "c": "meanwhile", "d": "because of"}
          },
          {
            "question": "Why does the writer use the word “also” in Paragraph (2)?",
            "options": {"a": "to give an example of the survey results", "b": "to show a list of answers reported in the survey", "c": "to give more information about the survey results", "d": "to show different results from those reported before"}
          }
        ]
      },
      {
        "title": "PASSAGE 3",
        "text": "(1) Since 1876, when Henry Heinz first started selling ketchup in glass bottles... (2) While it may look like a liquid, ketchup is actually a non-Newtonian fluid. Instead off lowing consistently the viscosity of these substances change with the amount of force put on them.",
        "questions": [
          {
            "question": "Which word can we use to replace the word “While” in Paragraph (2)?",
            "options": {"a": "because", "b": "although", "c": "however", "d": "besides"}
          }
        ]
      },
      {
        "title": "PASSAGE 4 (Air Pollution)",
        "text": "(1) Air Pollution Air pollution describes the chemicals and gasses... (2) Human activities have been the main causes of air Pollution, especially in modern cities. To support a larger population, there is always a need for energy. Transportation, and industries, which result in the spread of harmful chemicals into the air. In addition to outdoor air pollution, there is another type of pollution... (3) There are some simple things people can do to help keep the air around them cleaner. For example, people can use less energy because the more we use sources of energy, like electricity and gasoline, the more air Pollution we create.",
        "questions": [
          {
            "question": "Which word can we use to replace the words “for example” in Paragraph (3)?",
            "options": {"a": "Therefore", "b": "Although", "c": "In particular", "d": "For instance"}
          },
          {
            "question": "Why does the writer use the words “In addition” in Paragraph (2)?",
            "options": {"a": "to give more information about air pollution.", "b": "to give an example of air pollution.", "c": "to explain the result of air pollution.", "d": "to explain the cause of air pollution."}
          }
        ]
      },
      {
        "title": "PASSAGE 5 Space Junk",
        "text": "1) Many people know that garbage is a big problem on Earth... 5) “In our opinion the problem is very challenging, and it’s quite urgent as well,” said Marco Castronuovo, an Italian Space Agency researcher who is working to solve the problem.",
        "questions": [
          {
            "question": "Which word can we use to replace the words “as well” in paragraph (5)?",
            "options": {"a": "therefore", "b": "though", "c": "still", "d": "too"}
          }
        ]
      },
      {
        "title": "PASSAGE 6 Computer Ethics",
        "text": "2) Use of the internet has led to an increase in plagiarism... Software exists that can scan text and then look for examples of plagiarism by searching web pages on the internet.",
        "questions": [
          {
            "question": "Which word can we use to replace the word “then” at the end of Paragraph (2)?",
            "options": {"a": "even though", "b": "in addition", "c": "in contrast", "d": "after that"}
          }
        ]
      },
      {
        "title": "PASSAGE 7 Sickle Cell Anemia",
        "text": "1) Sickle cell anemia is a disease that damages red blood cells... 2) Like other types of anemia, sickle cell anemia causes tiredness, weakness, and shortness of breath... People with sickle cell anemia also are more likely to get infections. In addition, children with the disease may grow more slowly than other children.",
        "questions": [
          {
            "question": "Why does the writer use the words “in addition” in paragraph 2)?",
            "options": {"a": "To show another result of the disease", "b": "To explain what happens to children", "c": "To explain what happens after an infection", "d": "To show children are different than their parents."}
          }
        ]
      },
      {
        "title": "PASSAGE 8 Changes in Agriculture",
        "text": "1) Between 1950 and 1970, a world-wide effort to combat hunger and malnutrition... 2) At the heart of the green revolution was the use of high-yield varieties of seed and fertilizer. For thousands of years, farmers have added essential nutrients in the form of natural fertilizers such as animal manure. While some farmers today still use these traditional methods, many farmers use artificial fertilizers.",
        "questions": [
          {
            "question": "Why does the writer use the word “while” in Paragraph (2)?",
            "options": {"a": "to give more information about nutrients.", "b": "to give an example of the green revolution", "c": "to show that natural fertilizers are better.", "d": "to show that artificial fertilizers are more popular"}
          }
        ]
      },
      {
        "title": "PASSAGE 9",
        "text": "(1) During the French Revolutionary Wars, the French army had a problem... (3) Although food could be dried, smoked, fermented or pickled before the invention of canning, none of these methods were certain to be safe and they didn’t preserve flavor. Then came Nicolas Appert...",
        "questions": [
          {
            "question": "Why does the writer use the word “although” in Paragraph (3)?",
            "options": {"a": "To show an example of how food was kept safe.", "b": "To give more information about Nicolas Appert’s work.", "c": "To prove that flavor was important in keeping food safe.", "d": "To show that these methods of keeping food safe had some issues"}
          }
        ]
      },
      {
        "title": "PASSAGE 10 (Irish Potato Famine)",
        "text": "(1) Under British rule, three quarters of Irish farmland was used to grow crops that were exported. The potato was the main source of food for most of the Irish people. In 1845, disaster struck. A blight or disease destroyed the potato crop. Other crops, such as wheat and oats, were not affected. Yet British landowners continued to ship these crops outside Ireland, leaving little for the Irish except the blighted potatoes.",
        "questions": [
          {
            "question": "Why does the writer use the word “Yet” in Paragraph (1)?",
            "options": {"a": "To prove that the Irish only liked to eat potatoes most of the time", "b": "To give more information about which crops were sent to Canada", "c": "To show that crops, like wheat and oats, were also affected by disease", "d": "To show that British landowners sold good crops while people were hungry"}
          }
        ]
      }
    ]
  },
  {
    "strategy": "Fifth Strategy: Direct Questions",
    "passages": [
      {
        "title": "PASSAGE 1",
        "text": "1) Air pollution is a major problem all over the world today... In one 2009 study, researchers found 586 chemicals in the air of 52 typical homes in Arizona, USA. 2) The sources of indoor air pollution can be easily pollen, identified... Addition, the indoor air space of offices is full of volatile organic compounds (VOCs) produced by photocopiers, computers and other equipment. 4) There are a number of ways to improve our indoor air very simple and make our buildings healthier... One business center in New Delhi has successfully used this method for fifteen years. For a building with 30 people, they used over 1,200 plants to clean the air.",
        "questions": [
          {
            "question": "According to Paragraph (1), in the 2009 study, how many chemicals did the researchers find in the indoor air?",
            "options": {"a": "25", "b": "90", "c": "300", "d": "586"}
          },
          {
            "question": "According to Paragraph (2), which of the following are sources of VOCs?",
            "options": {"a": "cooking stoves and Teflon pans", "b": "photocopiers and computers", "c": "radon and formaldehyde", "d": "paints and furniture"}
          },
          {
            "question": "According to Paragraph (4), where are plants being used successfully to keep the air healthy?",
            "options": {"a": "in a research center in the USA", "b": "in a business center in India", "c": "in offices in America", "d": "in typical homes in Arizona"}
          }
        ]
      },
      {
        "title": "PASSAGE 2 (Growth of Public Education)",
        "text": "1) By the early 1800s, reformers persuaded many governments to set up public schools... 3) By the late 1880s, more and more children were in school... Beginning in 1879, schools to train teachers were established in France... 5) Colleges and universities expanded in this period... By the late 1800s, universities added courses in the sciences, especially in chemistry and physics... 6) Some women sought greater educational opportunities... Bedford College in England and Mount Holyoke in the United States.",
        "questions": [
          {
            "question": "In 1879, where did schools to train teachers start?",
            "options": {"a": "England", "b": "France", "c": "United States", "d": "Greece"}
          },
          {
            "question": "Where is Mount Holyoke College for Women",
            "options": {"a": "England", "b": "United States", "c": "France", "d": "Greece"}
          },
          {
            "question": "What university course was added to the curriculum by the late 1800s?",
            "options": {"a": "chemistry", "b": "mathematics", "c": "religion", "d": "physical education"}
          }
        ]
      },
      {
        "title": "PASSAGE 3 stars",
        "text": "1) If we look at the night sky carefully, we will see that the stars are of many different colors. Some are red, others are yellow and some are blue... 2) Astronomers have been able to classify stars according to color... For example, Ryiejol is a blue superstar as big as 40.000 suns and Beetlejuice is a superstar with a size equal to 17.000 suns. 3) ...It is possible to measure a star’s distance from the earth if astronomers know the color, brightness and whether or not it is a superstar.",
        "questions": [
          {
            "question": "Which of the following colors is NOT mentioned in the passage?",
            "options": {"a": "green", "b": "yellow", "c": "blue", "d": "red"}
          },
          {
            "question": "According to Paragraph (2) Beetlejuice is a superstar …………",
            "options": {"a": "as big as the sun", "b": "smaller than the sun", "c": "as big as 17,000 suns", "d": "as big as 40.000 suns"}
          },
          {
            "question": "According to Paragraph (2), (3)astronomers classify stars according to the following EXCEPT ………",
            "options": {"a": "size", "b": "color", "c": "shape", "d": "brightness"}
          }
        ]
      },
      {
        "title": "PASSAGE 4 Strange Substance",
        "text": "1) A mysterious, orange, sticky gel, found on the beaches of Kivalina, a village situated on the Alaskan coast between Kotzebue and Point Hope, was recently the source of much interest.",
        "questions": [
          {
            "question": "According to Paragraph (1), the strange, orange substance was found ……..",
            "options": {"a": "on the beaches of Kotzebue", "b": "on the beaches of Point Hope", "c": "close to a compound in Alaska", "d": "between Kotzebue and Point Hope"}
          }
        ]
      }
    ]
  },
  {
    "strategy": "Sixth Strategy: Purpose",
    "passages": [
      {
        "title": "PASSAGE 1 (Hot deserts)",
        "text": "1. Hot deserts are found near the tropics of Cancer and Capricorn... 2. Hot deserts have an extreme climate and challenging environment...",
        "questions": [
          {
            "question": "What is the writer’s main purpose?",
            "options": {"a": "to study geography", "b": "to convince", "c": "to inform", "d": "to entertain"}
          }
        ]
      },
      {
        "title": "PASSAGE 2 (Oceans)",
        "text": "1. The oceans make up 70 percent of the planet and contain 97 percent of all the water on Earth. It also makes up the vast majority of water stores...",
        "questions": [
          {
            "question": "What is the writer’s main purpose?",
            "options": {"a": "to recommend", "b": "to complain", "c": "to advise", "d": "to inform"}
          }
        ]
      },
      {
        "title": "PASSAGE 3 (Agriculture in the Middle East)",
        "text": "1 From the 8th century, the medieval Islamic world underwent a transformation in agricultural practice, described by the historian Andrew Watson as the Arab agricultural revolution...",
        "questions": [
          {
            "question": "What is the writer’s main purpose?",
            "options": {"a": "to convince", "b": "to inform", "c": "to explain", "d": "to study agriculture"}
          }
        ]
      },
      {
        "title": "PASSAGE 4 (Loss of Energy)",
        "text": "1. No system can be perfect in the way it operates. Whenever there is a change in a system, energy is transferred and some of that energy is dissipated...",
        "questions": [
          {
            "question": "What’s the writer’s main purpose?",
            "options": {"a": "to compare", "b": "to describe", "c": "to advise", "d": "to convince"}
          }
        ]
      },
      {
        "title": "PASSAGE 5",
        "text": "Statue of Liberty. The official name of this statue is “Liberty Enlightening the World.” It represents democracy or Liberal Thought...",
        "questions": [
          {
            "question": "The purpose of the passage is to give a ……..",
            "options": {"a": "Narrative", "b": "Description", "c": "Definition", "d": "Compariso"}
          }
        ]
      },
      {
        "title": "PASSAGE 6 (Importing and Exporting)",
        "text": "1. The history of importing and exporting dates back to the Roman Empire, when European and Asian traders imported and exported goods across the vast lands of Eurasia...",
        "questions": [
          {
            "question": "Why did the writer write this passage?",
            "options": {"a": "to entertain", "b": "to persuade", "c": "to explain", "d": "to give an example"}
          }
        ]
      }
    ]
  },
  {
    "strategy": "Seventh Strategy: Opinion",
    "passages": [
      {
        "title": "PASSAGE 1 (meat production)",
        "text": "4. Food and farming is one of the biggest economic sectors in the world... 7. Is meat still crucial to human life? Some nutritionists argue that, just because we’ve always eaten meat, that doesn’t mean we always have to.",
        "questions": [
          {
            "question": "Which of the following is an opinion?",
            "options": {"a": "Meat production will continue to grow.", "b": "Few people work farming in the UK.", "c": "The meat industry is worth closer to $174 million.", "d": "In the UK, 3,8 million are employed and 27 billion is made by the food industry."}
          }
        ]
      },
      {
        "title": "PASSAGE 2 (The Spanish Flu)",
        "text": "1. From 1918 to 1920 the virus known as the Spanish Flu infected 500 million people worldwide, killing 50 to 100 million of them... In the future, suggests the World Health Organization, there will be more and perhaps more deadly flu pandemics...",
        "questions": [
          {
            "question": "Which of the following statements about the Spanish Flu is an opinion?",
            "options": {"a": "It began in the United States.", "b": "It killed at least 50 million people.", "c": "There were no infections in Antarctica.", "d": "Now it could spread across the world in one day."}
          }
        ]
      },
      {
        "title": "PASSAGE 3 (The US response to the End of the Cold War)",
        "text": "1. When Mikhail Gorbachev became the leader of the Soviet Union (USSR) in 1985, no one predicted that the end of Cold War was only six years away... 5. Other history professors pointed out that no one really won the Cold War.",
        "questions": [
          {
            "question": "Which one of the following is an opinion?",
            "options": {"a": "The world remains a dangerous place.", "b": "USA spent a lot of money on weapons.", "c": "Many Americans died in Vietnam.", "d": "Nobody won the Cold War"}
          }
        ]
      },
      {
        "title": "PASSAGE 4 Hyperinflation",
        "text": "1. Because Germany had no goods to trade after its defeat in WW1, the Weimar government simply printed money... 4. It was clear to all, both inside and outside Germany, that the situation needed urgent action... Some historians suggest that this is evidence that many problems were not as severe as its politicians had made out.",
        "questions": [
          {
            "question": "Which of the following is an opinion?",
            "options": {"a": "From 1921-1923 the German middle class DID NOT buy houses.", "b": "Workers needed trolleys to carry home their wages", "c": "A new government took power in 1923", "d": "Germany’s problems were NOT as severe as its politicians had said"}
          }
        ]
      },
      {
        "title": "PASSAGE 5 (emotions)",
        "text": "1. What comes to mind when you think of emotions? It’s probably happiness, sadness, or fear... Emotions surely help us to fight or flee, but I believe that more importantly, they aid in learning, exploring, and reflecting.",
        "questions": [
          {
            "question": "Which of the following is the writer’s opinion?",
            "options": {"a": "People experience many emotions.", "b": "People know very little at birth.", "c": "Happiness and sadness are emotions.", "d": "Emotions help us learn, explore, and reflect."}
          }
        ]
      }
    ]
  },
  {
    "strategy": "Eighth Strategy: Deduction and Analysis",
    "passages": [
      {
        "title": "PASSAGE 1",
        "text": "1) The man received extensive therapy after the operation. He was able to move the thumb and fingers of his left hand eight months after surgery. After ten more months, the patient could move the fingers of his right hand and begin to feed himself...",
        "questions": [
          {
            "question": "How long after his operation did it take for the man to be able to use his hands to eat by himself?",
            "options": {"a": "8 months", "b": "10 months", "c": "18 months", "d": "22 months"}
          }
        ]
      },
      {
        "title": "PASSAGE 2",
        "text": "Vitamins are organic compounds that the body needs in small amounts to function properly. Humans need 13 different vitamins, which have many roles in the body. For example, Vitamin A helps maintain good vision. Vitamin B helps form red blood cells. Vitamin K is needed for blood to clot when you have a cut or other wound.",
        "questions": [
          {
            "question": "Why is vitamin K needed in the body?",
            "options": {"a": "to help muscles work normally", "b": "to help cuts stop bleeding", "c": "to make red blood cells", "d": "to improve the health of the skin"}
          }
        ]
      },
      {
        "title": "PASSAGE 3",
        "text": "The Saudi Food and Drug Authority SFDA) was established under the Council of Ministers in 2004, as an independent body corporate that directly reports to The President of Council of Ministers. The Authority’s objective is to regulate, oversee, and control food, drugs, medical devices, as well as to set their mandatory standard specifications, whether they are imported or locally manufactured.",
        "questions": [
          {
            "question": "You can understand from the passage that the SFDA deals with goods that are……",
            "options": {"a": "controlled", "b": "foreign only", "c": "Saudi and foreign", "d": "manufactured only"}
          }
        ]
      },
      {
        "title": "PASSAGE 4",
        "text": "(1) Muhammad Ali is a famous heavyweight boxer. He was born as Cassius Clay in Louisville, Kentucky, in the USA in 1942. (2) He had a very successful professional boxing career. In fact, he won the world heavyweight championship three times. The first time was when he beat the former champion, Sonny Liston, in 1964. In the same year, he became a Muslim and assumed the name Muhammad Ali. (3) Ten years later, in 1974, he became world champion again when he beat George Foreman in Zaire. He became champion for the third time in 1978 after beating Leon Spinks.",
        "questions": [
          {
            "question": "How old was Muhammed Ali when he became Muslim?",
            "options": {"a": "34", "b": "36", "c": "22", "d": "1960"}
          },
          {
            "question": "How old was Ali when he became champion for the third time?",
            "options": {"a": "34", "b": "36", "c": "22", "d": "62"}
          }
        ]
      },
      {
        "title": "PASSAGE 5",
        "text": "No matter whether you’re travelling for work or pleasure, wouldn’t you value the option to tailor your journey in accordance with your personal preferences and requirements? That’s exact why we developed our Red Services: a range of highly practical extra services that you can book along with your flight, as and when you need them.",
        "questions": [
          {
            "question": "Which method of travel does the passage talk about?",
            "options": {"a": "road", "b": "rail", "c": "sea", "d": "air"}
          }
        ]
      }
    ]
  },
  {
    "strategy": "Nineth Strategy: One Important Idea",
    "passages": [
      {
        "title": "PASSAGE 1 (GMO Bananas)",
        "text": "1. Each year, thousands of children in East Africa go blind or die because they don’t get enough vitamin A... 3. Bananas are not the only food whose yield or nutritional profile could be improved with genetic engineering. With climate change threatening to disrupt existing crops and growing global populations demanding more of those supplies, genetic engineering could be a solution for making the most of limited space and resources.",
        "questions": [
          {
            "question": "What is one important idea that the writer mentions?",
            "options": {"a": "That animals like to eat the orange bananas.", "b": "That a lack of vitamin A makes people go blind.", "c": "That children in Africa need better food.", "d": "That Uganda is a rich country in East Africa."}
          },
          {
            "question": "What is one important idea that the writer mentions?",
            "options": {"a": "That Ugandans have grown bananas for centuries.", "b": "That the way we produce food is changing", "c": "That climate change is a serious global problem.", "d": "That genetically modified bananas may save lives."}
          }
        ]
      },
      {
        "title": "PASSAGE 2 (The human cost of Stalin's 5-year plans)",
        "text": "1. In 1927. Stalin’s main aim for his country, Russia, was to modernize its industry... 2. However, there was a human cost to achieving the targets set in the 5-year plans. This cost was paid by the workers... The most famous worker was Alexei Stakhanov. In 1935, with two helpers, he managed to cut 102 tons of coal in one day’s work. This was fourteen times the average. Stakhanov became a hero of the country, and the government newspapers and radio encouraged all Russian workers to be like him.",
        "questions": [
          {
            "question": "What is one important idea related to the workers that the writer mentions in paragraph (2)?",
            "options": {"a": "They had to pay money.", "b": "They became famous.", "c": "They were foreigners.", "d": "They were hard working."}
          },
          {
            "question": "What is one important idea mentioned about Alexei Stakhanov in Paragraph (2)?",
            "options": {"a": "He was an example of a good worker.", "b": "He had two helpers.", "c": "He worked in 1935.", "d": "He was a coal worker"}
          }
        ]
      },
      {
        "title": "PASSAGE 4 (The Impact of Culture on Marketing Strategies)",
        "text": "(1) In marketing, a seller must understand the ways that consumers in different countries think about and use certain products before planning a marketing program. There are often surprises. For example, the average French man uses almost twice as many cosmetics and grooming devices as his wife...",
        "questions": [
          {
            "question": "What is one important idea about marketing in Paragraph (1)?",
            "options": {"a": "consumers", "b": "cosmetics", "c": "surprises", "d": "devices"}
          }
        ]
      }
    ]
  },
  {
    "strategy": "Tenth Strategy: Title, main idea, and topic",
    "passages": [
      {
        "title": "PASSAGE 1",
        "text": "1. The traveler Marco Polo retuned from his famous expedition to the Far East with fruit-flavored ices... 2. The first wholesale manufacture of ice cream was in 1851 in Baltimore, Maryland by Jacob Fussel... 3. The making of ice cream slowly evolved for the next few decades...",
        "questions": [
          {
            "question": "What is the best title for this passage?",
            "options": {"a": "Varieties of Ice Cream", "b": "The History of Ice Cream", "c": "The Demand for Ice Cream", "d": "Ice Cream During the Wars"}
          }
        ]
      },
      {
        "title": "PASSAGE 2 (Meetings)",
        "text": "Meetings can waste a great deal of time, but you can make your meeting run more smoothly by following a few simple rules. First, have an agenda. This will help keep you focused on what is important. Next, decide who needs to be involved. More people mean less efficient discussion. Finally, keep the discussion moving...",
        "questions": [
          {
            "question": "The main idea of the passage is that meetings ………….",
            "options": {"a": "waste a lot of time", "b": "are NOT necessary", "c": "need to be held frequently", "d": "need to be planned and organized"}
          }
        ]
      },
      {
        "title": "PASSAGE 3",
        "text": "1. If we look at the night sky carefully, we will see that the stars are of many different colors... 2. Astronomers have been able to classify stars according to color... 3. Suppose an astronomer observes two stars, one brighter than the other. If neither of them is a superstar. he will know immediately that the brighter star is closer...",
        "questions": [
          {
            "question": "What is the main idea of the passage?",
            "options": {"a": "Astronomers have been able to measure how far the stars are from each other.", "b": "Astronomers have certain instruments to measure the color of the stars.", "c": "We can know the color of the stars by taking a photograph of the sky at night.", "d": "Stars can be categorized according to color and size."}
          }
        ]
      },
      {
        "title": "PASSAGE 4 (The human cost of Stalin's 5-year plans)",
        "text": "1. In 1927. Stalin’s main aim for his country, Russia, was to modernize its industry... 2. However, there was a human cost to achieving the targets set in the 5-year plans. This cost was paid by the workers... 3. Life was very difficult under Stalin. Workers had targets to meet and were punished if they did not meet them...",
        "questions": [
          {
            "question": "What is the main idea of the passage?",
            "options": {"a": "hard work in Russia’s factories", "b": "Stalin’s successful 5-year plan", "c": "Russia’s development in 1927", "d": "life working under Stalin"}
          }
        ]
      },
      {
        "title": "PASSAGE 5",
        "text": "2) Quantitative observations are measurements, which by definition consist of both a number and a unit. Examples of quantitative observations include the following the melting point of crystalline sulfur is 115.21 degrees Celsius, and 35.9 grams of table salt whose chemical name is sodium chloride dissolve in 100 grams of water at 20 degrees Celsius.",
        "questions": [
          {
            "question": "Which sentence gives the main idea of Paragraph 2)?",
            "options": {"a": "Quantitative observations are measurements, which by definition consist of both a number and a unit.", "b": "Examples of quantitative observations include the following.", "c": "The melting point of crystalline sulfur is 115.21 degrees Celsius.", "d": "35.9 grams of table salt-whose chemical name is sodium chloride dissolve in 100 grams of water at 20 degrees Celsius."}
          }
        ]
      },
      {
        "title": "PASSAGE 6",
        "text": "1) At 1.05am on Sunday 13 August 1961, East German border guards and army combat groups took up positions on the demarcation line at the Brandenburg Gate in central Berlin... 5) The fall, when it came, was quick. There were large demonstrations in the GDR in September 1989. In October, the country’s lifelong leader, Erich Honecker, resigned. On 9 November, the East German authorities lifted border controls to the west. including for private journeys to west Berlin, from 17 November. Germany was formally reunified just 11 months later.",
        "questions": [
          {
            "question": "Which sentence gives the main idea of Paragraph (5)?",
            "options": {"a": "The fall, when it came, was quick.", "b": "Germany was formally reunified just 11 months later.", "c": "There were large demonstrations in the GDR in September 1989.", "d": "In October, the country’s lifelong leader, Erik Honecker, resigned."}
          }
        ]
      }
    ]
  }
];

const dbPath = 'data/db.json';
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// The colors
const themes = ["sc-theme-blue", "sc-theme-red", "sc-theme-teal", "sc-theme-green", "sc-theme-purple", "sc-theme-gold"];
const icons = ["📌", "🔗", "❓", "🎯", "💭", "🧠", "💡", "📝"];

rawData.forEach((item, index) => {
  const strategyId = `r${index + 3}`; // Since 1 and 2 and vocab are 1, 2, 3
  const theme = themes[index % themes.length];
  const icon = icons[index % icons.length];
  
  const practice = [];
  
  item.passages.forEach((p, pIndex) => {
    p.questions.forEach((q, qIndex) => {
      practice.push({
        passageId: `${strategyId}-p${pIndex}-q${qIndex}`,
        passageText: p.title + "\\n" + p.text,
        q: q.question,
        opts: [q.options.a, q.options.b, q.options.c, q.options.d],
        c: 0, // Fallback, no correct answer was extracted reliably
        expl: "تفسير هذه الإجابة موجود في ملف الشرح المرفق." // Fallback explanation
      });
    });
  });

  const newUnit = {
    id: strategyId,
    title: item.strategy,
    type: "reading_strategy",
    page: {
      strategies: [
        {
          id: `rs${index + 3}`,
          theme: theme,
          icon: icon,
          title: item.strategy.split(':')[1] || item.strategy,
          subtitle: item.strategy.split(':')[0],
          usage: "قم بقراءة القطعة ثم أجب عن الأسئلة المرفقة.",
          practice: practice
        }
      ]
    }
  };
  
  db.reading.push(newUnit);
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Successfully appended all strategies to db.json');
