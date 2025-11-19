# Test the New Features

Both SQL migrations have run successfully! 🎉

## Step 1: Open Your Website

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: **http://localhost:5174**
   (Note: It's port 5174, not 5173)

## Step 2: Test Shared Access (Most Important!)

### Test 1: View All Drills
1. Log in to your account
2. Go to the Library page (`/library`)
3. You should now see **ALL drills** from all users, not just your own
4. If you have another user account, you can log in as them and see drills from other users too

### Test 2: Edit/Delete Any Drill
1. In the Library, try editing or deleting a drill created by another user
2. This should now work (before, it wouldn't allow you to edit others' drills)

### Test 3: View All Sessions
1. Go to the Saved Sessions page (`/sessions`)
2. You should see **ALL sessions** from all users
3. Try clicking on a session created by another user

### Test 4: Edit/Delete Any Session
1. Try editing or deleting a session created by another user
2. This should now work (before, it wouldn't allow you)

### Test 5: View All Media
1. In the Library, click on a drill that has a video/image
2. You should be able to view the media even if it was uploaded by another user
3. Before, you would get a permission error

## Step 3: Test New Session View Page

### Test 1: View a Session
1. Go to Saved Sessions (`/sessions`)
2. Click on a session card (the "View" button or click the card)
3. You should see a **new page** showing the session in read-only mode
4. The grid should show **only filled cells** (not always 4x3)

### Test 2: Dynamic Grid
1. On the session view page, if the session only has drills in 2 categories, you should only see 2 category sections
2. It should NOT show empty rows or empty cells

### Test 3: Drill Details Modal
1. On the session view page, **click on a drill** in the grid
2. A modal should pop up showing:
   - Drill name
   - Category
   - Number of players
   - Equipment list
   - Tags list
   - Video/image (if available)
   - Creator attribution (if available)
3. Click outside the modal or press X to close it

### Test 4: Action Buttons
On the session view page, you should see:
- **Edit** button - Click to go to edit mode
- **Duplicate** button - Creates a copy of the session
- **Delete** button - Deletes the session

### Test 5: Edit Mode
1. From the session view page, click **Edit**
2. You should go to `/sessions/:id/edit` 
3. This is the drag-and-drop editor where you can modify the session

## Step 4: Test Navigation

### Test 1: Default Navigation
1. Go to Saved Sessions (`/sessions`)
2. Click on a session card (not the button, just the card)
3. You should go to the **view** page (`/sessions/:id`), not the edit page

### Test 2: Button Navigation
1. On a session card, click the **"View"** button
2. You should go to the view page
3. From view page, click **"Edit"** button
4. You should go to the edit page

## What Should Work Now

✅ All users can see all drills
✅ All users can edit/delete any drill
✅ All users can see all sessions  
✅ All users can edit/delete any session
✅ All users can view all videos/images
✅ Session view page shows dynamic grid (only filled cells)
✅ Click drill in session view shows details modal
✅ Edit/Duplicate/Delete buttons work on view page
✅ Clicking session card goes to view, not edit

## Troubleshooting

### If you don't see drills from other users:
- Make sure you have at least 2 user accounts
- Log out and log in as a different user
- Check that the SQL migrations ran successfully (should see new policies in Supabase)

### If media won't load:
- Check browser console for errors (F12 → Console tab)
- Verify storage bucket is named `drill-videos`
- Check that the storage migration ran successfully

### If session view doesn't work:
- Check the browser console for errors
- Make sure you're clicking on a session that has drills in it
- Try refreshing the page

---

## Quick Checklist

- [ ] Website loads at http://localhost:5174
- [ ] Can see all drills from all users
- [ ] Can edit/delete any drill
- [ ] Can see all sessions from all users
- [ ] Can edit/delete any session
- [ ] Can view media from other users
- [ ] Session view page shows dynamic grid
- [ ] Click drill shows details modal
- [ ] Edit/Duplicate/Delete buttons work
- [ ] Clicking session card goes to view page

All done! Your new features should be working! 🚀

