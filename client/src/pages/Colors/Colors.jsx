import "./Colors.css";
import "../../utils/CustomColors.css";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../utils/UserContext";
const Colors = () => {
  const { name, isLoggedIn, userProfile, setUserProfile } =
    useContext(UserContext);
  const [usedColor, setUsedColor] = useState(0);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (usedColor === 0) return;
    if (isLoggedIn) {
      const newUserProfile = userProfile;
      const [element] = newUserProfile.inventory[0].colors.splice(usedColor, 1);
      newUserProfile.inventory[0].colors.unshift(element);
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          xp: 0,
          userProfile: newUserProfile,
        }),
      };
      const data = await fetch("/update", requestOptions);
      const json = await data.json();
      if (data.status === 200) {
        setUserProfile(json.profile);
        navigate("");
        window.location.reload();
      }
    }
  };

  return (
    <section className="App">
      <div>
        <div className="colors-container">
          <div>
            <h5
              className={userProfile.inventory[0].colors[usedColor]}
              data-name={name}
            >
              {name}
            </h5>
          </div>
          <div className="owned-colors">
            {userProfile.inventory[0].colors.map((color, index) => (
              <div
                key={index}
                style={{
                  outline:
                    index === usedColor ? "solid 2px lightgreen" : "unset",
                }}
                onClick={() => setUsedColor(index)}
              >
                <p className={color} data-name="COLOR">
                  COLOR
                </p>
              </div>
            ))}
          </div>
          <button onClick={() => handleSave()}>SAVE COLOR</button>
        </div>
      </div>
    </section>
  );
};

export default Colors;
