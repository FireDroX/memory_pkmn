import { useLayoutEffect, useState, useContext } from "react";
import { FaTrophy } from "react-icons/fa";
import { UserContext } from "../../utils/UserContext";
import "./Leaderboard.css";

const Leaderboard = () => {
  const { name } = useContext(UserContext);
  const [leaderboards, setLeaderboards] = useState({
    levels: [],
    game_wons: [],
    shiny_pairs_found: [],
  });

  useLayoutEffect(() => {
    fetch("/leaderboard").then(async (data) => {
      const json = await data.json();
      setLeaderboards(json);
    });
  }, []);
  return (
    <section className="App">
      <div>
        <div className="leaderboard-container">
          <h4>LEADERBOARDS</h4>
          <div className="leaderboards">
            <div>
              <h5>LEVELS</h5>
              <br />
              <div>
                {[...leaderboards.levels].splice(0, 5).map((levels, index) => (
                  <p key={index}>
                    <span>
                      {index + 1 === 1 ? (
                        <FaTrophy color="#FFD700" />
                      ) : index + 1 === 2 ? (
                        <FaTrophy color="#C0C0C0" />
                      ) : index + 1 === 3 ? (
                        <FaTrophy color="#CD7F32" />
                      ) : (
                        `${index + 1}.`
                      )}
                    </span>
                    <span>{levels.name}</span>
                    <span>({levels.score})</span>
                  </p>
                ))}
                {name !== "" ? (
                  <>
                    <br />
                    {(() => {
                      if (!name) return;
                      const user = leaderboards.levels.filter(
                        (user) => user.name === name
                      )[0];
                      if (!user) return;
                      const index = leaderboards.levels.indexOf(user);
                      return (
                        <p key={index}>
                          <span>
                            {index + 1 === 1 ? (
                              <FaTrophy color="#FFD700" />
                            ) : index + 1 === 2 ? (
                              <FaTrophy color="#C0C0C0" />
                            ) : index + 1 === 3 ? (
                              <FaTrophy color="#CD7F32" />
                            ) : (
                              `${index + 1}.`
                            )}
                          </span>
                          <span>{user.name}</span>
                          <span>({user.score})</span>
                        </p>
                      );
                    })()}
                  </>
                ) : (
                  false
                )}
              </div>
            </div>
            <div>
              <h5>GAMES WON</h5>
              <br />
              <div>
                {[...leaderboards.game_wons]
                  .splice(0, 5)
                  .map((game_wons, index) => (
                    <p key={index}>
                      <span>
                        {index + 1 === 1 ? (
                          <FaTrophy color="#FFD700" />
                        ) : index + 1 === 2 ? (
                          <FaTrophy color="#C0C0C0" />
                        ) : index + 1 === 3 ? (
                          <FaTrophy color="#CD7F32" />
                        ) : (
                          `${index + 1}.`
                        )}
                      </span>
                      <span>{game_wons.name}</span>
                      <span>({game_wons.score})</span>
                    </p>
                  ))}
                {name !== "" ? (
                  <>
                    <br />
                    {(() => {
                      if (!name) return;
                      const user = leaderboards.game_wons.filter(
                        (user) => user.name === name
                      )[0];
                      if (!user) return;
                      const index = leaderboards.game_wons.indexOf(user);
                      return (
                        <p key={index}>
                          <span>
                            {index + 1 === 1 ? (
                              <FaTrophy color="#FFD700" />
                            ) : index + 1 === 2 ? (
                              <FaTrophy color="#C0C0C0" />
                            ) : index + 1 === 3 ? (
                              <FaTrophy color="#CD7F32" />
                            ) : (
                              `${index + 1}.`
                            )}
                          </span>
                          <span>{user.name}</span>
                          <span>({user.score})</span>
                        </p>
                      );
                    })()}
                  </>
                ) : (
                  false
                )}
              </div>
            </div>
            <div>
              <h5>SHINY FOUND</h5>
              <br />
              <div>
                {[...leaderboards.shiny_pairs_found]
                  .splice(0, 5)
                  .map((shiny_pairs_found, index) => (
                    <p key={index}>
                      <span>
                        {index + 1 === 1 ? (
                          <FaTrophy color="#FFD700" />
                        ) : index + 1 === 2 ? (
                          <FaTrophy color="#C0C0C0" />
                        ) : index + 1 === 3 ? (
                          <FaTrophy color="#CD7F32" />
                        ) : (
                          `${index + 1}.`
                        )}
                      </span>
                      <span>{shiny_pairs_found.name}</span>
                      <span>({shiny_pairs_found.score})</span>
                    </p>
                  ))}
                {name !== "" ? (
                  <>
                    <br />
                    {(() => {
                      if (!name) return;
                      const user = leaderboards.shiny_pairs_found.filter(
                        (user) => user.name === name
                      )[0];
                      if (!user) return;
                      const index =
                        leaderboards.shiny_pairs_found.indexOf(user);
                      return (
                        <p key={index}>
                          <span>
                            {index + 1 === 1 ? (
                              <FaTrophy color="#FFD700" />
                            ) : index + 1 === 2 ? (
                              <FaTrophy color="#C0C0C0" />
                            ) : index + 1 === 3 ? (
                              <FaTrophy color="#CD7F32" />
                            ) : (
                              `${index + 1}.`
                            )}
                          </span>
                          <span>{user.name}</span>
                          <span>({user.score})</span>
                        </p>
                      );
                    })()}
                  </>
                ) : (
                  false
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;
