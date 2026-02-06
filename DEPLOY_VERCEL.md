# Déploiement de Jang sur Vercel

## Méthode 1 : Via GitHub (Recommandé)

### Étape 1 : Créer un repo GitHub

1. Va sur https://github.com/new
2. Nom du repo : `jang-app`
3. Laisse le repo privé
4. Clique "Create repository"

### Étape 2 : Push le code

```bash
cd "/Users/mentor/Documents/Jang 1.0/Application /sketch-to-software-flow-main"

# Ajouter GitHub comme remote (remplace TON_USERNAME)
git remote add origin https://github.com/TON_USERNAME/jang-app.git

# Push
git branch -M main
git push -u origin main
```

### Étape 3 : Déployer sur Vercel

1. Va sur https://vercel.com
2. Connecte-toi avec GitHub
3. Clique "Add New Project"
4. Importe le repo `jang-app`
5. **Configure les variables d'environnement :**

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://pwjnavblbouxhyxejpaf.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3am5hdmJsYm91eGh5eGVqcGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTk5MjksImV4cCI6MjA4NTg3NTkyOX0.9xAo9OWMFRUyO9-DtlHDmMut70lCjxD-jg6DhJeOT1M` |

6. Clique "Deploy"

---

## Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Login
vercel login

# Déployer
cd "/Users/mentor/Documents/Jang 1.0/Application /sketch-to-software-flow-main"
vercel

# Pour la production
vercel --prod
```

---

## Configuration Supabase pour la production

### Ajouter l'URL Vercel aux URLs autorisées

1. Va sur https://supabase.com/dashboard/project/pwjnavblbouxhyxejpaf/auth/url-configuration
2. Dans "Site URL", mets ton URL Vercel (ex: `https://jang-app.vercel.app`)
3. Dans "Redirect URLs", ajoute :
   - `https://jang-app.vercel.app/**`
   - `https://jang-app.vercel.app/login`
   - `https://jang-app.vercel.app/reset-password`

---

## Domaine personnalisé (optionnel)

1. Dans Vercel, va dans Settings → Domains
2. Ajoute ton domaine (ex: `jang.sn`)
3. Configure les DNS comme indiqué

---

## Vérification

Après déploiement, vérifie :
- [ ] La page de login s'affiche
- [ ] L'inscription fonctionne
- [ ] L'app est installable (PWA)
- [ ] Les icônes s'affichent correctement

🎉 **Jang est en ligne !**
