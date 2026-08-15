import "./Colors.css";
import "../../utils/CustomColors.css";
import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../utils/UserContext";

const Colors = () => {
  const { name, userProfile, setUserProfile } = useContext(UserContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
            <button
              onClick={() => navigate("/profile")}
              aria-label={t("colors.back")}
            >
              <FaArrowLeft />
            </button>
            <div>
              <span className="eyebrow">{t("colors.eyebrow")}</span>
              <h2>{t("colors.title")}</h2>
              <p>{t("colors.description")}</p>
            </div>
          </header>

          <div className="color-preview">
            <span>{t("colors.preview")}</span>
            <h3 className={selectedColor} data-name={name}>
              {name}
            </h3>
            <small>
              {i18n.exists(`colors.names.${selectedColor}`)
                ? t(`colors.names.${selectedColor}`)
                : t("colors.special")}
            </small>
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
                  <small>
                    {i18n.exists(`colors.names.${color}`)
                      ? t(`colors.names.${color}`)
                      : t("colors.style", { number: index + 1 })}
                  </small>
                  {selected && <FaCheck />}
                </button>
              );
            })}
          </div>

          <div className="colors-actions">
            <button className="secondary" onClick={() => navigate("/profile")}>
              {t("common.cancel")}
            </button>
            <button onClick={handleSave} disabled={isSaving}>
              {t(isSaving ? "colors.saving" : "colors.use")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Colors;
