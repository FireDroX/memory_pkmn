import "./Colors.css";
import "../../utils/CustomColors.css";
import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { UserContext } from "../../utils/UserContext";

const colorNames = {
  "color-default": "Classique",
  "color-1": "Rose spectre",
  "color-2": "Aura menthe",
  "color-3": "Soleil",
  "color-4": "Glacier",
  "color-5": "Nebuleuse",
  "color-6": "Magma",
  "color-7": "Eclair",
  "color-8": "Jungle",
  "color-9": "Ocean",
  "color-glitch": "MissingNo.",
  "color-zekrom": "Zekrom",
  "color-shiny": "Shiny",
};

const Colors = () => {
  const { name, userProfile, setUserProfile } = useContext(UserContext);
  const navigate = useNavigate();
  const colors = userProfile.inventory?.[0]?.colors || ["color-default"];
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    if (selectedColor === colors[0]) {
      navigate("/profile");
      return;
    }

    setIsSaving(true);
    const updatedProfile = structuredClone(userProfile);
    updatedProfile.inventory[0].colors = [
      selectedColor,
      ...colors.filter((color) => color !== selectedColor),
    ];

    const response = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        xp: 0,
        userProfile: updatedProfile,
      }),
    });
    const data = await response.json();

    if (response.ok && data.profile) {
      setUserProfile(data.profile);
      navigate("/profile");
    } else {
      setIsSaving(false);
    }
  };

  return (
    <section className="App colors-page">
      <div>
        <div className="colors-container">
          <header className="colors-heading">
            <button onClick={() => navigate("/profile")} aria-label="Retour">
              <FaArrowLeft />
            </button>
            <div>
              <span className="eyebrow">PERSONNALISATION</span>
              <h2>Couleur du pseudo</h2>
              <p>
                Les nouveaux styles se debloquent en montant de niveau et en
                terminant certains succes.
              </p>
            </div>
          </header>

          <div className="color-preview">
            <span>Apercu en jeu</span>
            <h3 className={selectedColor} data-name={name}>
              {name}
            </h3>
            <small>{colorNames[selectedColor] || "Style special"}</small>
          </div>

          <div className="owned-colors">
            {colors.map((color, index) => {
              const selected = color === selectedColor;
              return (
                <button
                  key={color}
                  className={selected ? "selected" : ""}
                  onClick={() => setSelectedColor(color)}
                >
                  <span className={color} data-name={name}>
                    {name}
                  </span>
                  <small>{colorNames[color] || `Style ${index + 1}`}</small>
                  {selected && <FaCheck />}
                </button>
              );
            })}
          </div>

          <div className="colors-actions">
            <button className="secondary" onClick={() => navigate("/profile")}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Enregistrement..." : "Utiliser cette couleur"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Colors;
